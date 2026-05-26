
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'POST':
        if (isset($input['action'])) {
            switch($input['action']) {
                case 'login':
                    login($db, $input);
                    break;
                case 'logout':
                    logout();
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(array("message" => "Invalid action"));
            }
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function login($db, $input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Username and password required"));
        return;
    }

    $query = "SELECT id, username, password_hash, role FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $input['username']);
    $stmt->execute();

    if ($stmt->rowCount() == 1) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($input['password'], $row['password_hash'])) {
            session_start();
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['role'] = $row['role'];
            
            echo json_encode(array(
                "success" => true,
                "user" => array(
                    "id" => $row['id'],
                    "username" => $row['username'],
                    "role" => $row['role']
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid credentials"));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Invalid credentials"));
    }
}

function logout() {
    session_start();
    session_destroy();
    echo json_encode(array("success" => true, "message" => "Logged out successfully"));
}
?>
