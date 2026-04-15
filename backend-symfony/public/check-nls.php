<?php
// Force NLS_LANG FIRST before anything else
putenv('NLS_LANG=AMERICAN_AMERICA.AL32UTF8');

header('Content-Type: application/json');

// This autom explicitly tests NLS_LANG setting
echo json_encode([
    'nls_lang' => getenv('NLS_LANG'),
    'oracle_home' => getenv('ORACLE_HOME'),
    'tns_admin' => getenv('TNS_ADMIN'),
    'connection_test' => 'pending'
]);

if (getenv('NLS_LANG') === 'AMERICAN_AMERICA.AL32UTF8') {
    $tns = "127.0.0.1:1521/XEPDB1";
    $conn = @oci_connect('C##caprino', 'CaprinoPass2025', $tns);
    
    if ($conn) {
        echo json_encode(['status' => 'connected', 'nls_lang' => getenv('NLS_LANG')]);
        oci_close($conn);
    } else {
        $e = oci_error();
        echo json_encode(['status' => 'error', 'error' => $e['message'], 'nls_lang' => getenv('NLS_LANG')]);
    }
} else {
    echo json_encode(['status' => 'nls_lang_invalid', 'actual' => getenv('NLS_LANG')]);
}
?>
