// Classroom pacing lock, not a security boundary. Never persist the unlock.
(function(root) {
  const isLockedScene = id => typeof id === 'string' && (id.startsWith('chapter2-') || id.startsWith('c2-'));
  const accepts = value => value === '0715';
  let unlocked = false, pending = false;
  function request(enter) {
    if (unlocked) { enter(); return; }
    if (pending) return;
    pending = true;
    const dialog = document.createElement('dialog');
    dialog.className = 'title-dialog';
    dialog.setAttribute('aria-labelledby', 'chapterLockTitle');
    dialog.innerHTML = '<form><h2 id="chapterLockTitle">선생님 확인이 필요해요</h2><p>장 선택과 2편은 비밀번호로 열 수 있어요.<br>1편은 새로 시작 또는 이어하기로 플레이하세요.</p><label for="chapterPassword">비밀번호</label><input id="chapterPassword" type="password" inputmode="numeric" maxlength="4" autocomplete="off" required><p role="status" aria-live="polite"></p><button type="submit">확인</button><button type="button" data-cancel>돌아가기</button></form>';
    document.body.appendChild(dialog);
    const field = dialog.querySelector('input');
    dialog.addEventListener('close', () => { pending = false; dialog.remove(); }, {once:true});
    dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault();
      if (!accepts(field.value)) {
        dialog.querySelector('[role="status"]').textContent = '비밀번호가 맞지 않아요. 선생님께 확인해 주세요.';
        field.value = ''; field.focus(); return;
      }
      unlocked = true; dialog.close(); enter();
    };
    dialog.showModal(); field.focus();
  }
  const api = {isLockedScene, accepts, request, get unlocked() { return unlocked; }};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChapterAccess = api;
})(typeof window !== 'undefined' ? window : globalThis);
