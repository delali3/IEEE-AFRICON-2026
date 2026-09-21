<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 65536) {
    respond(413, ['ok' => false, 'message' => 'Invalid request size.']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

if (!empty($data['website'])) {
    respond(200, ['ok' => true]);
}

function field(array $data, string $key, int $max = 2000): string
{
    $value = trim((string)($data[$key] ?? ''));
    $value = str_replace(["\0", "\r"], '', $value);
    return mb_substr($value, 0, $max);
}

function valid_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false
        && !preg_match('/[\r\n]/', $email);
}

function configured_recipient(string $environmentKey): string
{
    foreach ([$environmentKey, 'AFRICON_CONTACT_EMAIL'] as $key) {
        $candidate = trim((string)getenv($key));
        if (valid_email($candidate)) {
            return $candidate;
        }
    }

    $wpLoad = __DIR__ . '/wp-load.php';
    if (!function_exists('get_option') && is_file($wpLoad)) {
        require_once $wpLoad;
    }
    if (function_exists('get_option')) {
        $candidate = trim((string)get_option('admin_email'));
        if (valid_email($candidate)) {
            return $candidate;
        }
    }

    return getenv('AFRICON_FORM_DRY_RUN') === '1' ? 'test@example.com' : '';
}

function deliver(string $to, string $subject, string $body, string $replyTo, string $bcc): bool
{
    if (getenv('AFRICON_FORM_DRY_RUN') === '1') {
        return true;
    }

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $replyTo,
        'Bcc: ' . $bcc,
    ];

    if (function_exists('wp_mail')) {
        return (bool)wp_mail($to, $subject, $body, $headers);
    }

    return mail($to, $subject, $body, implode("\r\n", $headers));
}

$type = field($data, 'type', 30);
$email = field($data, 'email', 254);
$fullName = field($data, $type === 'contact' ? 'name' : 'fullName', 160);

if ($fullName === '' || !valid_email($email)) {
    respond(422, ['ok' => false, 'message' => 'A valid name and email address are required.']);
}

if ($type === 'contact') {
    $topic = field($data, 'subject', 120);
    $message = field($data, 'message', 10000);
    if ($topic === '' || $message === '') {
        respond(422, ['ok' => false, 'message' => 'A subject and message are required.']);
    }

    $subject = '[AFRICON 2027 Contact] ' . $topic;
    $body = "Thank you for contacting IEEE AFRICON 2027.\n\n"
        . "A copy of your message is below. The conference team will reply separately.\n\n"
        . "Name: {$fullName}\nEmail: {$email}\nTopic: {$topic}\n\nMessage:\n{$message}\n";
    $recipient = configured_recipient('AFRICON_CONTACT_EMAIL');
    if ($recipient === '') {
        respond(503, ['ok' => false, 'message' => 'The conference recipient email is not configured.']);
    }
    $sent = deliver($email, $subject, $body, $recipient, $recipient);
} elseif ($type === 'registration') {
    if (($data['privacyConsent'] ?? false) !== true || ($data['termsConsent'] ?? false) !== true) {
        respond(422, ['ok' => false, 'message' => 'Both IEEE consent statements are required.']);
    }

    foreach (['designation', 'phone', 'country', 'institution', 'role', 'presentationMode'] as $requiredKey) {
        if (field($data, $requiredKey, 500) === '') {
            respond(422, ['ok' => false, 'message' => 'Required registration details are missing.']);
        }
    }

    $reference = field($data, 'reference', 40);
    if (!preg_match('/^AFC27-[A-Z0-9]{6,12}$/', $reference)) {
        respond(422, ['ok' => false, 'message' => 'Invalid registration reference.']);
    }

    $labels = [
        'designation' => 'Designation',
        'fullName' => 'Name',
        'email' => 'Email',
        'phone' => 'Phone',
        'gender' => 'Gender (optional)',
        'address' => 'Address',
        'city' => 'City',
        'country' => 'Country',
        'institution' => 'Institution',
        'department' => 'Department',
        'ieeeMember' => 'IEEE member',
        'student' => 'Student',
        'paperIds' => 'Paper ID(s)',
        'paperTitles' => 'Paper title(s)',
        'role' => 'Role',
        'presentationMode' => 'Presentation mode',
        'dietaryRequirements' => 'Dietary requirements',
        'accessibilityRequirements' => 'Accessibility accommodations',
        'participationNotes' => 'Additional notes',
    ];

    $details = '';
    foreach ($labels as $key => $label) {
        $details .= $label . ': ' . field($data, $key, 4000) . "\n";
    }

    $subject = '[AFRICON 2027 Registration Request] ' . $reference;
    $body = "Your IEEE AFRICON 2027 registration request was received.\n\n"
        . "Reference: {$reference}\n\n{$details}\n"
        . "IEEE Privacy Policy consent: Yes\nIEEE Event Terms consent: Yes\n"
        . "Submitted (UTC): " . gmdate('Y-m-d H:i:s') . "\n\n"
        . "This request is not a confirmed registration and no payment has been collected. "
        . "The registration team will contact you after fees and payment arrangements are approved.\n";
    $recipient = configured_recipient('AFRICON_REGISTRATION_EMAIL');
    if ($recipient === '') {
        respond(503, ['ok' => false, 'message' => 'The conference recipient email is not configured.']);
    }
    $sent = deliver($email, $subject, $body, $recipient, $recipient);
} else {
    respond(422, ['ok' => false, 'message' => 'Unknown form type.']);
}

if (!$sent) {
    respond(503, ['ok' => false, 'message' => 'The mail service could not accept the message.']);
}

respond(200, ['ok' => true]);
