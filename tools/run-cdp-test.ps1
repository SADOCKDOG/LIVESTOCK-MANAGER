# Chrome DevTools Protocol - Test Runner
param(
    [string]$JsExpression,
    [int]$TimeoutSec = 30
)

$wsUrl = "ws://localhost:9222/devtools/page/4F9B297DAA6E18723231EFC179AA9976"

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource
$cts.CancelAfter($TimeoutSec * 1000)

try {
    $connectTask = $ws.ConnectAsync([uri]$wsUrl, $cts.Token)
    $connectTask.Wait()

    if ($ws.State -ne [System.Net.WebSockets.WebSocketState]::Open) {
        Write-Error "WebSocket not connected. State: $($ws.State)"
        exit 1
    }

    # Send Runtime.evaluate command
    $msg = @{
        id = 1
        method = "Runtime.evaluate"
        params = @{
            expression = $JsExpression
            returnByValue = $true
            awaitPromise = $true
        }
    } | ConvertTo-Json -Depth 10 -Compress

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
    $segment = [ArraySegment[byte]]::new($bytes)

    $sendTask = $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token)
    $sendTask.Wait()

    # Receive response
    $buffer = New-Object byte[] 1048576
    $result = ""

    do {
        $seg = [ArraySegment[byte]]::new($buffer)
        $recvTask = $ws.ReceiveAsync($seg, $cts.Token)
        $recvTask.Wait()
        $recvResult = $recvTask.Result

        $result += [System.Text.Encoding]::UTF8.GetString($buffer, 0, $recvResult.Count)

    } while (-not $recvResult.EndOfMessage)

    # Parse and output result
    $json = $result | ConvertFrom-Json

    if ($json.result) {
        if ($json.result.result.value) {
            Write-Output $json.result.result.value
        } elseif ($json.result.result.description) {
            Write-Output $json.result.result.description
        } elseif ($json.result.exceptionDetails) {
            Write-Error "JS Exception: $($json.result.exceptionDetails.text)"
            Write-Output $json.result.exceptionDetails.exception.description
        } else {
            Write-Output ($json.result | ConvertTo-Json -Depth 10)
        }
    } else {
        Write-Output $result
    }

} catch {
    Write-Error "Error: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        Write-Error "Inner: $($_.Exception.InnerException.Message)"
    }
} finally {
    if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "", [System.Threading.CancellationToken]::None).Wait()
    }
    $ws.Dispose()
    $cts.Dispose()
}

