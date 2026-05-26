
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include_once '../config/database.php';

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Unauthorized"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        getTransactions($db);
        break;
    case 'POST':
        createTransaction($db, $input);
        break;
    case 'PUT':
        updateTransaction($db, $input);
        break;
    case 'DELETE':
        deleteTransaction($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getTransactions($db) {
    $year = isset($_GET['year']) ? $_GET['year'] : date('Y');
    $month = isset($_GET['month']) ? $_GET['month'] : date('n') - 1;
    
    $query = "SELECT t.*, c.name as category_name, u.username as added_by_username 
              FROM transactions t 
              JOIN categories c ON t.category_id = c.id 
              JOIN users u ON t.added_by_user_id = u.id 
              WHERE YEAR(t.date) = :year AND MONTH(t.date) = :month + 1
              ORDER BY t.date DESC, t.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":year", $year);
    $stmt->bindParam(":month", $month);
    $stmt->execute();
    
    $transactions = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $transactions[] = array(
            "id" => $row['id'],
            "date" => $row['date'],
            "type" => $row['type'],
            "category" => $row['category_name'],
            "amount" => floatval($row['amount']),
            "customerName" => $row['customer_name'],
            "numberOfPictures" => intval($row['number_of_pictures']),
            "whatsappNumber" => $row['whatsapp_number'],
            "details" => $row['details'],
            "addedBy" => $row['added_by_username']
        );
    }
    
    echo json_encode($transactions);
}

function createTransaction($db, $input) {
    // Validate required fields
    $required_fields = ['date', 'type', 'category', 'amount', 'customerName'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required field: " . $field));
            return;
        }
    }
    
    // Get category ID
    $category_query = "SELECT id FROM categories WHERE name = :category";
    $category_stmt = $db->prepare($category_query);
    $category_stmt->bindParam(":category", $input['category']);
    $category_stmt->execute();
    
    if ($category_stmt->rowCount() == 0) {
        // Create new category
        $create_category = "INSERT INTO categories (name) VALUES (:category)";
        $create_stmt = $db->prepare($create_category);
        $create_stmt->bindParam(":category", $input['category']);
        $create_stmt->execute();
        $category_id = $db->lastInsertId();
    } else {
        $category_row = $category_stmt->fetch(PDO::FETCH_ASSOC);
        $category_id = $category_row['id'];
    }
    
    $query = "INSERT INTO transactions 
              (date, type, category_id, amount, customer_name, number_of_pictures, whatsapp_number, details, added_by_user_id) 
              VALUES (:date, :type, :category_id, :amount, :customer_name, :number_of_pictures, :whatsapp_number, :details, :user_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":date", $input['date']);
    $stmt->bindParam(":type", $input['type']);
    $stmt->bindParam(":category_id", $category_id);
    $stmt->bindParam(":amount", $input['amount']);
    $stmt->bindParam(":customer_name", $input['customerName']);
    $stmt->bindParam(":number_of_pictures", $input['numberOfPictures']);
    $stmt->bindParam(":whatsapp_number", $input['whatsappNumber']);
    $stmt->bindParam(":details", $input['details']);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        // Log admin action if user is admin
        if ($_SESSION['role'] === 'admin') {
            logAdminAction($db, "Added {$input['type']} transaction: ZMW {$input['amount']} for {$input['customerName']}");
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "Transaction created successfully", "id" => $db->lastInsertId()));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to create transaction"));
    }
}

function updateTransaction($db, $input) {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Only admins can update transactions"));
        return;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Transaction ID required"));
        return;
    }
    
    // Build dynamic update query based on provided fields
    $fields = array();
    $values = array();
    
    $allowed_fields = ['date', 'type', 'amount', 'customer_name', 'number_of_pictures', 'whatsapp_number', 'details'];
    
    foreach ($allowed_fields as $field) {
        $input_key = ($field === 'customer_name') ? 'customerName' : 
                    (($field === 'number_of_pictures') ? 'numberOfPictures' : 
                    (($field === 'whatsapp_number') ? 'whatsappNumber' : $field));
        
        if (isset($input[$input_key])) {
            $fields[] = "$field = :$field";
            $values[$field] = $input[$input_key];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(array("message" => "No fields to update"));
        return;
    }
    
    $query = "UPDATE transactions SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($values as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    $stmt->bindParam(":id", $input['id']);
    
    if ($stmt->execute()) {
        logAdminAction($db, "Updated transaction ID: {$input['id']}");
        echo json_encode(array("message" => "Transaction updated successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to update transaction"));
    }
}

function deleteTransaction($db, $input) {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Only admins can delete transactions"));
        return;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Transaction ID required"));
        return;
    }
    
    // Get transaction details for logging
    $get_query = "SELECT * FROM transactions WHERE id = :id";
    $get_stmt = $db->prepare($get_query);
    $get_stmt->bindParam(":id", $input['id']);
    $get_stmt->execute();
    
    if ($get_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Transaction not found"));
        return;
    }
    
    $transaction = $get_stmt->fetch(PDO::FETCH_ASSOC);
    
    $query = "DELETE FROM transactions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $input['id']);
    
    if ($stmt->execute()) {
        logAdminAction($db, "Deleted {$transaction['type']} transaction: ZMW {$transaction['amount']} for {$transaction['customer_name']}");
        echo json_encode(array("message" => "Transaction deleted successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to delete transaction"));
    }
}

function logAdminAction($db, $action) {
    $query = "INSERT INTO admin_logs (user_id, action) VALUES (:user_id, :action)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->bindParam(":action", $action);
    $stmt->execute();
}
?>
