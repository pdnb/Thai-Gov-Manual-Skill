param([string]$Docx, [string]$Pdf)
# Open in Word, refresh every table of contents / field (page numbers), save, and export PDF with fonts embedded.
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($Docx, $false, $false)
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
    $doc.Save()
    # wdExportFormatPDF = 17, OptimizeFor print = 0, embed fonts via ISO19005? keep default (Word embeds TrueType subsets)
    $doc.ExportAsFixedFormat($Pdf, 17, $false, 0)
    "pages: " + $doc.ComputeStatistics(2)
    "tocs: " + $doc.TablesOfContents.Count
    $doc.Close($false)
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
