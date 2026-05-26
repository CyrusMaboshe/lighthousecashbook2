
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
        getMessages($db);
        break;
    case 'POST':
        createMessage($db, $input);
        break;
    case 'DELETE':
        deleteMessage($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getMessages($db) {
    $conversationId = isset($_GET['conversation_id']) ? $_GET['conversation_id'] : null;
    
    if ($conversationId) {
        $query = "SELECT m.*, u.username as sender_username, u.role as sender_role 
                  FROM messages m 
                  JOIN users u ON m.sender_user_id = u.id 
                  WHERE m.conversation_id = :conversation_id
                  ORDER BY m.created_at ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":conversation_id", $conversationId);
    } else {
        $query = "SELECT m.*, u.username as sender_username, u.role as sender_role 
                  FROM messages m 
                  JOIN users u ON m.sender_user_id = u.id 
                  ORDER BY m.created_at DESC";
        
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    
    $messages = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $messages[] = array(
            "id" => $row['id'],
            "message" => $row['message'],
            "sender" => $row['sender_username'],
            "senderRole" => $row['sender_role'],
            "conversationId" => $row['conversation_id'],
            "timestamp" => $row['created_at']
        );
    }
    
    echo json_encode($messages);
}

function createMessage($db, $input) {
    $required_fields = ['message', 'conversationId'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required field: " . $field));
            return;
        }
    }
    
    $query = "INSERT INTO messages (message, conversation_id, sender_user_id) 
              VALUES (:message, :conversation_id, :user_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":message", $input['message']);
    $stmt->bindParam(":conversation_id", $input['conversationId']);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "Message sent successfully", "id" => $db->lastInsertId()));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to send message"));
    }
}

function deleteMessage($db, $input) {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(array("message" => "Only admins can delete messages"));
        return;
    }
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Message ID required"));
        return;
    }
    
    $query = "DELETE FROM messages WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $input['id']);
    
    if ($stmt->execute()) {
        echo json_encode(array("message" => "Message deleted successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to delete message"));
    }
}
?>
