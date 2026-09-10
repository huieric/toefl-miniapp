Add-Type -AssemblyName System.Speech
$text = "Professor Chen, I wanted to talk about my research paper topic. Of course, sit down. What topic were you considering? I am interested in urban sustainability, but I am not sure if I have enough background."
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Zira Desktop')
$s.SetOutputToWaveFile('D:\TapTap游戏赛道调研\toefl-miniapp\uploads\audio\quick_test.wav')
$s.Speak($text)
$s.Dispose()
$item = Get-Item 'D:\TapTap游戏赛道调研\toefl-miniapp\uploads\audio\quick_test.wav' -ErrorAction SilentlyContinue
if ($item) { Write-Host "SUCCESS: $($item.Length) bytes" } else { Write-Host "FAILED: no file" }
