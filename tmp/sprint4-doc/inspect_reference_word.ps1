$ErrorActionPreference = 'Stop'
$docPath = (Resolve-Path 'output\docx\Actividad_Integradora_2_Avance_actual.docx').Path
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($docPath, $false, $true)
    $doc.Repaginate()
    $pages = $doc.ComputeStatistics(2)
    Write-Output "PAGES=$pages"
    for ($page = 1; $page -le $pages; $page++) {
        $start = $doc.GoTo(1, 1, $page).Start
        if ($page -lt $pages) {
            $end = $doc.GoTo(1, 1, ($page + 1)).Start
        } else {
            $end = $doc.Content.End
        }
        $sample = ($doc.Range($start, $end).Text -replace '[\r\a]+', ' ' -replace '\s+', ' ').Trim()
        if ($sample.Length -gt 220) { $sample = $sample.Substring(0, 220) }
        Write-Output ("PAGE={0};START={1};END={2};TEXT={3}" -f $page, $start, $end, $sample)
    }
    $doc.Close($false)
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
