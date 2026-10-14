# Học liệu Git & GitHub

Khóa Git & GitHub gồm **24 buổi bắt buộc**: 20 buổi học và bốn buổi kiểm tra tại 6, 12, 18, 24. Sáu buổi mở rộng không quyết định hoàn thành khóa. Khóa mở độc lập với DSA, ML và DA; tiến độ/bản nháp riêng, XP và vật phẩm dùng chung.

## Tài liệu và hiệu đính

[Danh mục nguồn](../content/git/sources.json) ghi đủ **10 ảnh** trong `study documents/Git Github/`, mã `GIT-<prefix>`, trang, chủ đề, SHA-256 và bài liên quan. Các trang cùng chủ đề được gom thành bài thống nhất; ảnh gốc vẫn mở tại mục tài liệu nguồn. [Reading](../content/git/reading.mjs) chứa giải thích ngắn, ví dụ đời thường, phản ví dụ và câu hỏi; [curriculum](../content/git/curriculum.mjs) gắn nhãn Từ tài liệu, Bổ sung, Hiệu đính.

| Trang | Mã nguồn | Nội dung dùng trong khóa |
|---|---|---|
| 1 | GIT-814498804 | Git/GitHub, repository, commit và bắt đầu |
| 2 | GIT-814034494 | Ba vùng, lệnh cơ bản, nhánh, cộng tác |
| 3 | GIT-813923075 | Index, feature workflow, hoàn tác, ignore |
| 4 | GIT-813583093 | Local/remote, trạng thái, merge/rebase, conflict |
| 5 | GIT-813672265 | Stash, tag, cherry-pick, remote và aliases |
| 6 | GIT-814971288 | Hoàn tác, PR, CI, workflow và lỗi thường gặp |
| 7 | GIT-814584732 | Branching, reflog, merge/rebase, phỏng vấn |
| 8 | GIT-799972477 | Lệnh nâng cao, workflow, GitHub, commit message |
| 9 | GIT-814585089 | Ba vùng, PR, hooks, config và hoàn tác |
| 10 | GIT-814428256 | Reset/revert/restore, bảo mật, Actions và branch naming |

Chín hiệu đính có mã, ảnh gốc, nhận định được sửa và liên kết tài liệu chính thức:

- **GIT-E01:** Pull fetch rồi tích hợp theo strategy/config; không luôn tạo merge commit. Bài chỉ rõ `--ff-only` hoặc `--no-rebase`. [git-pull](https://git-scm.com/docs/git-pull).
- **GIT-E02:** Merge có thể fast-forward, chỉ di chuyển ref. [git-merge](https://git-scm.com/docs/git-merge).
- **GIT-E03:** Ignore không tự untrack hoặc xóa secret khỏi lịch sử; key đã lộ cần thu hồi/đổi. [gitignore](https://git-scm.com/docs/gitignore).
- **GIT-E04:** `git prune` xử lý object; `fetch --prune` xử lý remote-tracking refs đã mất. [git-prune](https://git-scm.com/docs/git-prune).
- **GIT-E05:** Reflog ghi ref đã di chuyển, không sao lưu mọi nội dung chưa commit. [git-reflog](https://git-scm.com/docs/git-reflog).
- **GIT-E06:** Reset hard tác động tracked files/index và có thể xóa untracked cản đường; không đồng nghĩa clean mọi file. [git-reset](https://git-scm.com/docs/git-reset).
- **GIT-E07:** Tag thường ổn định cho release nhưng có thể được di chuyển/xóa; annotated tag còn có metadata. [git-tag](https://git-scm.com/docs/git-tag).
- **GIT-E08:** Tránh viết lại lịch sử đã chia sẻ khi chưa thống nhất là chính sách nhóm, không phải giới hạn Git chỉ cho rebase local. [git-rebase](https://git-scm.com/docs/git-rebase).
- **GIT-E09:** Restore working tree mặc định đọc index; restore staged mặc định đọc HEAD. [git-restore](https://git-scm.com/docs/git-restore).

## Hành trình và tương tác

| Buổi | Chủ đề |
|---|---|
| 1–5 | Git/GitHub, ba vùng, commit, status/diff/log, gitignore |
| 6 | Kiểm tra lưu thay đổi đúng nơi |
| 7–11 | Branch, feature, merge/fast-forward, conflict, restore/unstage |
| 12 | Kiểm tra nhánh và merge |
| 13–17 | Remote, fetch, pull, push, pull request/review |
| 18 | Kiểm tra chia sẻ và đồng bộ |
| 19–23 | Stash, reset, revert, tag/release, cộng tác |
| 24 | Kiểm tra tổng hợp workflow an toàn |
| 25–30 | Cherry-pick, rebase, reflog, release workflow, hooks/Actions, README/issue/review |

Mỗi buổi có tám hoạt động ngắn: chọn đáp án, sắp thứ tự workflow, ghép ba vùng, đọc/truy vết trạng thái và tìm hiểu nhầm. File editor, ba vùng working/index/HEAD, đồ thị commit và terminal là một mô hình thống nhất. Chạy từng dòng, xem bước trước/sau, reset và thay dữ liệu giúp quan sát thay đổi trước khi viết chuỗi lệnh riêng. Phần đọc sâu và ví dụ lệnh được thu gọn để tránh màn hình nhiều chữ.

Trang Mẹo & Phỏng vấn bổ sung **12 mẹo, 20 chủ đề phỏng vấn Git**, mỗi chủ đề có biến thể khách quan và phần tự luận/rubric. Kim cương chỉ cấp từ phần có checker, theo hạn mức chung của ứng dụng.

## Mô phỏng và phạm vi

[git-simulator.mjs](../shared/git-simulator.mjs) là mô hình dữ liệu thuần JavaScript, không gọi shell, filesystem, mạng hoặc Git trên máy. `edit`/`delete` là thao tác editor ảo, không phải lệnh Git thật. Remote chỉ chấp nhận `virtual://`; push/fetch không kết nối tài khoản GitHub. ID `c0/c1/r1` là nhãn minh họa, không phải SHA.

Lệnh hỗ trợ: init; status/diff/log; add/commit/amend; branch/switch/checkout; merge/abort; restore; reset soft/mixed/hard; revert/cherry-pick; stash push/list/apply/pop/drop và `-u`; tag; remote add; fetch/prune; pull ff-only/no-rebase; push nhánh/tag; reflog; rebase tuyến tính. Tham số ngoài allowlist báo rõ chưa hỗ trợ. Parser từ chối pipe, chuỗi lệnh shell, substitution, đường dẫn host, `.git`, tên gây prototype pollution và force push. Lệnh thất bại giữ nguyên trạng thái trước lệnh.

Giới hạn: **120 dòng, 64 KB UTF-8 mỗi script, 8 KB mỗi dòng, 2 MB tổng trạng thái/lịch sử/đầu ra**. Vượt giới hạn trả kết quả có lỗi, dừng trước lệnh gây tràn và không đánh dấu workflow đạt.

Mô hình cố ý hẹp hơn Git thật: checkout chỉ nhánh có tên và yêu cầu dữ liệu sạch; conflict được phát hiện ở mức file; rebase chỉ chuỗi tuyến tính không conflict; revert/cherry-pick chỉ patch không conflict từ commit tối đa một parent; ignore chỉ exact path, suffix glob, directory prefix. Pull thất bại rollback cả thao tác, trong khi Git thật có thể vẫn lưu kết quả fetch. Stash không có `--index`, interactive rebase, Git hooks/Actions và PR/issue chỉ được giải thích/luyện quyết định, không thực thi hay tạo đối tượng thật.

## Chấm và cuối khóa

Ngân hàng có **26 mẫu thao tác**. Mỗi lượt cố định seed/version; nội dung file thay đổi theo seed, tên nhánh/file giữ theo contract để một chuỗi thao tác hợp lệ chạy trên mọi biến thể. Bài chấm kiểm tra trạng thái file, index, refs, parent/ancestry, stash, tag, remote và phần dữ liệu cần giữ ngoài lịch sử. Không so chuỗi lệnh với lời giải mẫu; chấp nhận message khác, status/diff/log xen kẽ và các chuỗi tương đương như `checkout -b` thay `switch -c`. Bài ignore chấp nhận đảo thứ tự pattern, thêm dòng chú thích hoặc newline cuối khi vẫn có hai quy tắc yêu cầu và giữ file riêng ngoài mọi commit. Workflow cần tạo commit chấp nhận amend tương đương khi snapshot/ancestry đáp ứng đề; mốc bị thay thế còn lưu trong mô hình không tự làm fail. Những bài nói rõ không tạo thêm commit vẫn kiểm tra điều kiện đó.

`gradeGitScript` chạy mô hình rồi dùng `checkGitGoal` đối chiếu điều kiện của fixture do backend dựng. JSON hoặc trường `pass` người học cung cấp không quyết định điểm. Câu truy vết dùng prefix chuỗi thao tác, không đưa goal/đáp án vào phần input công khai. Trong câu truy vết, `commits` được ghi rõ là mọi mốc còn lưu trong mô hình, gồm mốc không còn ref; `log --all` chỉ lấy mốc reachable từ HEAD/nhánh/tag/remote-tracking refs.

Buổi thường cần ít nhất 4/5 câu kiến thức và bài thao tác bắt buộc đạt. Kiểm tra cần 8/10 và cả hai workflow đạt. Bài cuối khóa **“Cộng tác xây một dự án nhỏ”** có ba repository ảo độc lập: tạo feature giữ main, merge conflict có hai parent, tích hợp remote trước push. Kèm năm phần luận, truy vết và test; rubric 60/20/10/10, cần ít nhất 80, đủ ba workflow và đủ phần luận. Điểm xác nhận kỹ năng trên mô hình theo đặc tả, không tuyên bố đã thực hiện cộng tác trên GitHub thật. Gemini góp ý văn bản; không quyết định pass/fail.

Custom test chỉ nhận `{problemId,input:{seed:"ten-test"},expected:<mục tiêu dự đoán>}`. Backend dựng fixture từ seed và kiểm tra dự đoán trước khi chạy lỗi mẫu; không nhận repository tùy ý từ frontend.

## Bằng chứng kiểm chứng — 14/10/2026

`node --test tests/git-course.test.mjs` đã đạt **14/14 nhóm kiểm thử**, không skip, ngày 14/10/2026 (khoảng 13,8 giây):

- Hash/ánh xạ đủ 10 nguồn; schema 30 bài/26 mẫu; bốn kiểm tra; 12 mẹo và 20 chủ đề phỏng vấn.
- **26 mẫu × 200 seed = 5.200 fixture**: lời giải mẫu đạt, input không bị sửa, no-op và thao tác kết thúc sai bị từ chối. Có chuỗi khác đúng và kiểm tra ancestry/parent/remote độc lập bằng điều kiện đã biết.
- **30 buổi × 200 seed = 6.000 lab/truy vết**: tám hoạt động, checker, thứ tự đáp án, prefix trạng thái và không lộ đáp án công khai.
- **Toàn bộ 27 trạng thái nhỏ** cho HEAD/index/working thuộc `""`, `"A"`, `"B"`: add, commit và hai nguồn restore giữ đúng snapshot.
- Staging snapshot, conflict/abort, soft/mixed/hard, non-fast-forward, ignored/stash, parent `^2` khác depth `~2`, rebase không cần thay base, tag và reflog.
- 20 nhóm lệnh nguy hiểm/ngoài phạm vi lặp thành 120 lần kiểm tra rollback, UTF-8 input, 2 MB đầu ra và dừng trước thao tác tràn.
- Capstone tại 75/80/90 điểm, thiếu code/luận, test phát hiện sáu lỗi mẫu và từ chối repository injection.

Các test này kiểm chứng mô hình và contract BytePath; không phải bộ kiểm thử đầy đủ cho cài đặt Git ngoài ứng dụng. Kiểm tra API, UI và giữ dữ liệu chung được ghi trong báo cáo tích hợp của đợt phát hành.
