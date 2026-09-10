Add-Type -AssemblyName System.Speech

$audioDir = 'D:\TapTap游戏赛道调研\toefl-miniapp\server\uploads\audio'
$tempDir = 'D:\TapTap游戏赛道调研\toefl-miniapp\server\temp'

if (!(Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir -Force | Out-Null }
if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir -Force | Out-Null }

$ids = @(1114, 1115, 1116, 1117, 1118, 1129, 1130, 1131, 1132, 1133, 1134)
$types = @{'1114'='conversation';'1115'='conversation';'1116'='conversation';'1117'='lecture';'1118'='lecture';'1129'='lecture';'1130'='conversation';'1131'='lecture';'1132'='lecture';'1133'='conversation';'1134'='lecture'}

$passages = @(
  "[Librarian]: What can I help you with today? [Student]: Hi, I'd like to return this book about American history. I think it's a week overdue. [Librarian]: Let me check. Yes, I see it here. Don't worry about the late fee — our system waived it this semester. [Student]: Oh, that's great! I was worried about that. By the way, do you have any new books on 20th-century European history? [Librarian]: Actually, we just received a shipment of books on World War II last week. Would you like me to show you? [Student]: That would be wonderful, thank you!"
  "[Student]: Professor Chen, I wanted to talk about my research paper topic. [Professor]: Of course, sit down. What topic were you considering? [Student]: I'm interested in urban sustainability, but I'm not sure if I have enough background. [Professor]: That's actually a fascinating area. However, you haven't taken my Urban Ecology course yet, which would be very helpful. [Student]: I see. That's next semester. [Professor]: Exactly. I'd strongly recommend taking it. In the meantime, you could read some of the papers I've put on reserve in the library."
  "[Advisor]: Good morning! How can I help you today? [Student]: Hi, I'm planning to study abroad next year and I wanted to make sure I'm on track. [Advisor]: That's exciting! Which program are you considering? [Student]: I'm looking at the exchange program in Australia. I need to take certain courses before I go. [Advisor]: Let me check your current record. You've completed the English requirement and most of your general education courses. You just need one more electives course before you leave."
  "[Professor]: Good morning, everyone. Today we're going to explore one of the most fundamental processes in biology — photosynthesis. Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in specialized organelles called chloroplasts, which contain a green pigment called chlorophyll. The process can be summarized in two main stages. First, light-dependent reactions capture energy from sunlight and convert it into ATP and NADPH. Then, in the second stage known as the Calvin cycle, this energy is used to convert carbon dioxide into glucose. Why is photosynthesis so important? Well, it is the primary source of oxygen in Earth's atmosphere, and it forms the foundation of almost all food chains on our planet."
  "[Professor]: Today we're going to discuss Impressionism, one of the most revolutionary art movements in Western history. It emerged in France in the 1860s and was named after Claude Monet's painting 'Impression, Sunrise.' What made Impressionism so different? Traditional academic art valued smooth surfaces, precise detail, and historical or mythological themes. Impressionists rejected all of this. Instead, they painted outdoors, capturing fleeting impressions of light and color. They used visible brushstrokes and bright, unmixed colors placed side by side. The viewer's eye would blend the colors from a distance. This technique was radical for its time, and many critics initially ridiculed these works. But today, Impressionist paintings are among the most celebrated artworks in the world."
  "[Professor]: Today we are going to explore the periodic table, one of the most useful tools in chemistry. You may have seen this chart of elements many times, but have you ever wondered how it is organized? The periodic table is organized by atomic number — that is, the number of protons in the nucleus of an atom. Elements are arranged in order from left to right, top to bottom. But the table also has a clever structure that groups elements with similar properties together. The vertical columns are called groups, and elements in the same group share similar chemical behavior. For example, Group 1 contains the alkali metals — lithium, sodium, potassium — all of which react violently with water. The horizontal rows are called periods. One of the most interesting features of the periodic table is the staircase line that separates metals from nonmetals. Elements to the left are metals, those to the right are nonmetals, and those along the staircase — such as silicon and germanium — are metalloids, which have properties of both."
  "[Student]: Hi, I have a question about the dining hall. [Dining Staff]: Sure, what can I help you with? [Student]: I have a severe peanut allergy. I want to know what precautions the kitchen takes. [Dining Staff]: That's a great question. Our kitchen has a dedicated allergen-free preparation area. Staff are trained in handling allergens, and all ingredients are clearly labeled. [Student]: That's really reassuring. Are there allergen-free options at every meal? [Dining Staff]: Yes, we have a separate section for allergen-free meals. You can find our allergen menu posted online and also at the dining hall entrance."
  "[Professor]: Let's talk about sleep tonight — one of the most important but most neglected aspects of health. When you sleep, your brain doesn't just shut off. It goes through several distinct stages, each with a unique function. Stage 1 is the lightest sleep, where your muscles relax and your breathing slows. Stage 2 is where you spend most of your sleep time — your heart rate drops and your body temperature decreases. Then comes Stage 3, known as deep sleep, which is crucial for physical recovery. During this stage, your body repairs tissues, builds bone and muscle, and strengthens the immune system. The final stage is REM — Rapid Eye Movement — where most vivid dreaming occurs. REM sleep is essential for memory consolidation, which is why students who sleep well before exams tend to perform better."
  "[Professor]: Today we're going to discuss price elasticity of demand, one of the most important concepts in economics. Elasticity measures how responsive consumers are to a change in price. If demand is elastic, a small price increase leads to a large drop in quantity demanded. Think of restaurant meals — if a restaurant raises prices by 20%, many people will simply eat elsewhere. But if demand is inelastic, price changes don't affect quantity much. A classic example is medicine — if your life depends on a medication, you'll pay almost any price. Several factors determine elasticity: the availability of substitutes, whether the good is a necessity or luxury, the proportion of income spent on the good, and the time horizon. Goods with many substitutes tend to be more elastic."
  "[Student]: Dr. Williams, do you have a moment? [Professor]: Of course, please come in. What's on your mind? [Student]: I've been thinking about my semester project, and I have an idea I wanted to discuss with you. [Professor]: That's great. What topic did you have in mind? [Student]: I'm interested in studying the impact of urban green spaces on community health. I think it combines environmental science with public health, which I find really fascinating. [Professor]: That's an excellent topic — timely and relevant. I think it would work well as a collaborative project. I'll put together some reading materials for you."
  "[Professor]: Today we're going to explore jazz, arguably the most original American art form. Jazz emerged in the late 19th and early 20th centuries in New Orleans, a city with a unique cultural mix of African, Caribbean, and European influences. Jazz has its roots in African rhythmic traditions, blues, and spirituals. What made jazz unique was improvisation — the ability of musicians to create music spontaneously. Unlike classical music, which follows a fixed score, jazz musicians compose in the moment, reacting to each other in real time. The evolution of jazz can be divided into several key periods: Early jazz and swing in the 1920s-30s, bebop in the 1940s which emphasized complex harmonies and fast tempos, cool jazz in the 1950s, and then fusion in the 1960s-70s which incorporated rock and R&B elements. Each era reflected the social and cultural changes of its time, making jazz not just music but a living history of America."
)

$success = 0
$failed = 0

for ($i = 0; $i -lt $ids.Count; $i++) {
  $id = $ids[$i]
  $type = $types[$id.ToString()]
  $text = $passages[$i]
  $voice = if ($type -eq 'conversation') { 'Microsoft David Desktop' } else { 'Microsoft Zira Desktop' }
  $filename = "listening_${id}_tts.wav"
  $filepath = Join-Path $audioDir $filename
  
  Write-Host "`n[$($i+1)/11] #${id} [${type}]"
  
  try {
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SelectVoice($voice)
    $s.SetOutputToWaveFile($filepath)
    $s.Speak($text)
    $s.Dispose()
    [System.GC]::Collect()
    
    $file = Get-Item $filepath -ErrorAction SilentlyContinue
    if ($file -and $file.Length -gt 2000) {
      Write-Host "  OK: $($voice.Split(' ')[1]) $([math]::Round($file.Length/1024, 1))KB"
      $success++
    } else {
      Write-Host "  Small or missing file"
      $failed++
    }
  } catch {
    Write-Host "  Error: $_"
    $failed++
  }
}

Write-Host "`n=== Done ==="
Write-Host "Success: $success, Failed: $failed"
