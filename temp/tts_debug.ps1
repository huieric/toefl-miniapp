Add-Type -AssemblyName System.Speech
$text = [System.IO.File]::ReadAllText('D:\TapTap游戏赛道调研\toefl-miniapp\temp\tts_debug.txt')
Write-Host "Text length: $($text.Length)"
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft David Desktop')
Write-Host "Voice selected"
$outputFile = 'D:\TapTap游戏赛道调研\toefl-miniapp\uploads\audio\tts_debug.wav'
$s.SetOutputToWaveFile($outputFile)
Write-Host "Output file set"
$s.Speak($text)
Write-Host "Spoken"
$s.Dispose()
Write-Host "Disposed"
