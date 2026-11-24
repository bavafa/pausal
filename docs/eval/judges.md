# Jev versus Qwen

Written by `pnpm eval --compare-judges` on the author's machine. It reads the stored scene descriptions and safety answers in `analysis`, runs the Qwen judge for scene type, sentiment and fit, and compares both judges to the labels by time. It changes no `analysis` or `decisions` file, and CI never runs it. Model answers vary between runs, so this file is a snapshot.

Clips: `000000000001`. Scenes judged: 6.

Clip `000000000001` is the hand-made fixture: its stored judge answers and labels are test data, so these numbers only show the comparison runs end to end.

## Agreement with labels, by sensitive category (share of labeled time)

| Category | Jev | Qwen |
|---|---|---|
| violence | 100.0 percent | 83.3 percent |
| deathOrGrief | 83.3 percent | 83.3 percent |
| sexual | 83.3 percent | 83.3 percent |
| medicalTrauma | 83.3 percent | 83.3 percent |
| childFocused | 83.3 percent | 83.3 percent |
| intenseDialogue | 100.0 percent | 100.0 percent |

## Top-product fit against labels

Both judges use the R3b fit cutoff of 0.6. Jev: 100.0 percent. Qwen: 100.0 percent.

## How often the judges differ

- Safe or not safe verdict: they differ on 0.0 percent of judged time.
- Scene type: same primary label on 66.7 percent of judged time.
- Sentiment: same level on 33.3 percent of judged time.

## Cost

- Jev (stored from the analysis run): not recorded (no analysis file carries usage yet).
- Qwen in this run: $0.0002 (judgeQwen 6 calls, fitQwen 6 calls).
