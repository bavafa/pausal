# Data sources

Purpose: record each data source, its licence and the attribution Pausall must show.
Audience: the author and contributors.
Status: draft. Last updated: 2026-11-23. General information, not legal advice. Accessed 2026-11-22.

| Source | Use in Pausall | Licence (verified) | Attribution or condition | Status |
|---|---|---|---|---|
| Amazon Berkeley Objects (ABO) [1] | Primary catalog, slice of about 20,000 products | CC BY 4.0 on the official index page. 147,702 listings, 398,212 images. abo-listings.tar 83 MB, abo-images-small.tar 3 GB, images up to 256 px | Credit "Amazon.com" for data; cite Collins et al., CVPR 2022 (arXiv:2110.06199); link the licence; state changes; do not imply endorsement | Confirmed. Licence file opened 2026-11-23: both tars ship the same LICENSE-CC-BY-4.0.txt (full CC BY 4.0 text, no NonCommercial wording), and both READMEs say CC BY 4.0. The older CC BY-NC wording some Amazon pages show does not appear in the download |
| IAB Content Taxonomy 3.1 [2] | Contextual categories and vocabulary for when not to advertise | No licence stated for the taxonomy files on the IAB page or in the repo README | Unknown | NOT confirmed. Do not copy the file into the repo until IAB confirms terms. Contact support@iabtechlab.com |
| Wikidata [3] | Optional genre and entity enrichment | CC0 for main, Property, Lexeme and EntitySchema namespaces; CC BY-SA 4.0 for other text | None required for CC0 data | Confirmed |
| Criteo public datasets [4] | Study only, to choose realistic distributions | CC BY-NC-SA 4.0 (uplift, attribution); 1TB click logs licence from Hugging Face page only | Non-commercial, share-alike | Not used in the product. Never copy or republish |
| Open Food Facts [5] | Possible later adapter | ODbL 1.0, DbCL, images CC BY-SA 3.0 | Attribution and share-alike | Not in MVP |
| Alibaba Model Studio terms [6] | Qwen calls on clip frames, transcripts and descriptions | Service terms, not a data licence | Read 2026-11-23: API inputs and outputs are not used for model training; uploaded files are kept until deleted or for 48 hours; the retention period for plain API calls and zero data retention access were not stated clearly, so only AI-generated sample clips are sent until that is checked | Summary done. Retention for plain calls to confirm before any upload |
| Etsy Open API v3 | Possible later adapter | Terms page returned 403, not read | Unknown | Not in MVP, unverified |

Known gap: ABO is weak in fashion, costumes, branded merchandise and cars (recorded as a limitation for the PRD).

Related work only, not used: MovieNet, Condensed Movies, MAD, MovieGraphs.

Sources: [1] https://amazon-berkeley-objects.s3.amazonaws.com/index.html [2] https://iabtechlab.com/standards/content-taxonomy/ [3] https://www.wikidata.org/wiki/Wikidata:Licensing [4] https://ailab.criteo.com/criteo-uplift-prediction-dataset/ [5] https://world.openfoodfacts.org/terms-of-use [6] https://www.alibabacloud.com/help/en/model-studio/data-retention-policy and https://help.aliyun.com/en/model-studio/privacy-notice (accessed 2026-11-23)
