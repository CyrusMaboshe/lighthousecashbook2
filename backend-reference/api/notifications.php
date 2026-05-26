
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
        getNotifications($db);
        break;
    case 'POST':
        createNotification($db, $input);
        break;
    case 'PUT':
        updateNotification($db, $input);
        break;
    case 'DELETE':
        deleteNotification($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getNotifications($db) {
    $query = "SELECT n.*, u.username as created_by_username 
              FROM notifications n 
              JOIN users u ON n.created_by_user_id = u.id 
              ORDER BY n.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $notifications = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $notifications[] = array(
            "id" => $row['id'],
            "title" => $row['title'],
            "message" => $row['message'],
            "priority" => $row['priority'],
            "createdBy" => $row['created_by_username'],
            "createdAt" => $row['created_at']
        );
    }
    
    echo json_encode($notifications);
}

function createNotification($db, $input) {
    $required_fields = ['title', 'message', 'priority'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required field: " . $field));
            return;
        }
    }
    
    $query = "INSERT INTO notifications (title, message, priority, created_by_user_id) 
              VALUES (:title, :message, :priority, :user_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":title", $input['title']);
    $stmt->bindParam(":message", $input['message']);
    $stmt->bindParam(":priority", $input['priority']);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        if ($_SESSION['role'] === 'admin') {
            logAdminAction($db, "Created {$input['priority']} notification: {$input['title']}");
        }
        
        http_response_code(201);
        echo json_encode(array("message" => "Notification created successfully", "id" => $db->lastInsertId()));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to create notification"));
    }
}

function updateNotification($db, $input) {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Only admins can update notifications"));
        return;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Notification ID required"));
        return;
    }
    
    $fields = array();
    $values = array();
    
    $allowed_fields = ['title', 'message', 'priority'];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = :$field";
            $values[$field] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(array("message" => "No fields to update"));
        return;
    }
    
    $query = "UPDATE notifications SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($values as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    $stmt->bindParam(":id", $input['id']);
    
    if ($stmt->execute()) {
        logAdminAction($db, "Updated notification ID: {$input['id']}");
        echo json_encode(array("message" => "Notification updated successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to update notification"));
    }
}

function deleteNotification($db, $input) {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Only admins can delete notifications"));
        return;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Notification ID required"));
        return;
    }
    
    $query = "DELETE FROM notifications WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $input['id']);
    
    if ($stmt->execute()) {
        logAdminAction($db, "Deleted notification ID: {$input['id']}");
        echo json_encode(array("message" => "Notification deleted successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to delete notification"));
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
