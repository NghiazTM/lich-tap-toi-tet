# Exercise image provenance

These six PNG files are unchanged screenshots of the public Prime Form video supplied by the user. They are reference illustrations from the video, not newly generated anatomy drawings.

- Original shared URL: https://web.facebook.com/share/v/1FKBnoTE8c/
- Canonical video: https://web.facebook.com/reel/3500844863420320
- Author displayed by Facebook: Prime Form.
- Caption: "6 tư thế giữ tĩnh tại nhà, không cần tạ. Bình luận số giây giữ đáy chống đẩy của bạn!"
- Video duration observed: 866.6 seconds (14:26.6).
- Capture method: `agent-browser screenshot 'video'` after seeking the video, with a browser viewport of 1920 × 1600.
- All six screenshots are 848 × 1508 pixels. No cropping, painting, retouching, or re-encoding was applied to their bytes.
- The app can present the central instruction panel with a CSS clipping rectangle of `x: 0, y: 515, width: 848, height: 478` in original image pixels. Keep the source attribution in the user interface.

| File | Video time | Depicted pose | Original screenshot filename |
| --- | --- | --- | --- |
| `bottom-pushup.png` | 01:30 (90s) | Đáy chống đẩy; low push-up hold, chest/shoulder/triceps labels | `gym-video-90-clean.png` |
| `deep-lunge.png` | 02:40 (160s) | Chùng chân sâu; chair-supported deep lunge | `gym-video-160-large.png` |
| `towel-pull.png` | 04:10 (250s) | Vượt lực cản; standing on a towel and pulling its ends upward | `gym-video-250-clean.png` |
| `hollow-hold.png` | 05:45 (345s) | Thân rỗng; bent-knee regression with hands toward chest | `gym-video-345-clean.png` |
| `wall-handstand.png` | 06:40 (400s) | Trồng chuối dựa tường; straight arms, shoulders near ears | `gym-video-400-clean.png` |
| `l-sit.png` | 08:20 (500s) | L-sit; bent-knee starting variation supported on two chairs | `gym-video-500-clean.png` |

The 03:30 (210s) frame shows running/jumping illustrations, so it was deliberately not used for the lunge image. A full-size wall-press instruction image was not found in the sampled video frames; these six files do not include a wall-press image. Any separately generated wall-press illustration must be labelled as supplementary and must not be attributed as a frame from this video.

## Supplemental generated asset

`wall-press.png` is a separate wall-press illustration generated with the built-in `image_gen.imagegen` tool. It uses the video illustration as a style reference only. The app labels this image as supplementary rather than a video frame. See [the exact prompt](wall-press-prompt.md).

## Original frame hashes

```text
0B98895105EE0EA6B13F5571D85BC4A0CD6B86408032F6F027152C3D38004900  bottom-pushup.png
08A04DFFAE0B7D2FA2B81D9813AB7297DCFBAC87EF1A4132B1228FB7A05F388B  deep-lunge.png
B0598E72BA450493C94D193F77D524C0EF0D2BAB5A7656912D719388CABE18AB  hollow-hold.png
227450EA5A3A0F2AB2B6954FA6CAB71D74E1C42C4F4F551C19C346D450F5FF69  l-sit.png
653925357E278E70AB7C74249C4FB4EBD21A340C7EDBAB365E8DB7C51B2035E1  towel-pull.png
F8CB0F2A41D43F33D0A6CC86DA6EE47596AA904C5E6600E72CEE06A5ECD85302  wall-handstand.png
```
