/* AI비서 첫걸음 피클 — 시연용 인터랙션 */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- toast ---------- */
  var toastEl = $("#toast");
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2400);
  }

  /* ---------- tabs ---------- */
  var tabs = $$(".tab");
  var panels = $$(".tab-panel");

  function activateTab(name, opts) {
    var target = tabs.filter(function (t) { return t.dataset.tab === name; })[0];
    if (!target) return;
    tabs.forEach(function (t) {
      var on = t === target;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      var on = p.dataset.panel === name;
      p.hidden = !on;
    });
    if (opts && opts.scroll) {
      var head = $(".tabs-wrap");
      var top = (head ? head.getBoundingClientRect().top + window.pageYOffset : 0) - 66;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activateTab(tab.dataset.tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); next.focus(); activateTab(next.dataset.tab); }
    });
  });

  $$("[data-tab-link]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      activateTab(link.dataset.tabLink, { scroll: true });
      history.replaceState(null, "", "#" + link.dataset.tabLink);
    });
  });

  var initial = (location.hash || "").replace("#", "");
  if (["intro", "curriculum", "instructor", "faq"].indexOf(initial) >= 0) {
    activateTab(initial);
  }

  /* ---------- wish (찜) ---------- */
  var wishBtns = $$("#wishBtn, #wishBtn2");
  var wished = false;
  try { wished = sessionStorage.getItem("pickle-landing-wish") === "1"; } catch (e) {}

  function paintWish() {
    wishBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", wished ? "true" : "false");
      var label = b.querySelector(".icon-label") || b.querySelector("span");
      if (label) label.textContent = wished ? "찜했어요" : "찜하기";
      if (b.id === "wishBtn") b.setAttribute("aria-label", wished ? "찜 해제" : "찜하기");
    });
  }
  wishBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      wished = !wished;
      try { sessionStorage.setItem("pickle-landing-wish", wished ? "1" : "0"); } catch (e) {}
      paintWish();
      toast(wished ? "찜한 강의에 담았어요" : "찜을 해제했어요");
    });
  });
  paintWish();

  /* ---------- share ---------- */
  function share() {
    var url = location.href.split("#")[0];
    if (navigator.share) {
      navigator.share({
        title: "AI비서 첫걸음 피클 | AI강사 이정임",
        text: "매주 목요일 20:30 · Zoom Live · 4주 — AI 에이전트가 어디까지 할 수 있나?",
        url: url
      }).catch(function () {});
      return;
    }
    copyToClipboard(url, "링크를 복사했어요. 붙여 넣기 해 보세요.");
  }

  function copyToClipboard(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); },
        function () { fallbackCopy(text, okMsg); });
    } else {
      fallbackCopy(text, okMsg);
    }
  }

  function fallbackCopy(text, okMsg) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast(okMsg); }
    catch (e) { toast("주소창의 주소를 복사해 주세요: " + text); }
    document.body.removeChild(ta);
  }

  $$("#shareBtn, #shareBtn2, #shareAfterBtn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.id === "shareAfterBtn") {
        closeModal();
        setTimeout(share, 120);
      } else {
        share();
      }
    });
  });

  /* ---------- modal ---------- */
  var modal = $("#applyModal");
  var form = $("#applyForm");
  var formStep = $('[data-step="form"]');
  var doneStep = $('[data-step="done"]');
  var lastFocus = null;

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (form) form.reset();
    formStep.hidden = false;
    doneStep.hidden = true;
    var first = form ? form.querySelector('input[name="name"]') : null;
    setTimeout(function () { if (first) first.focus(); }, 60);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$("[data-open-apply]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });
  $$("[data-close-modal]").forEach(function (b) {
    b.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab" && modal && !modal.hidden) {
      var f = $$("button, input, a[href]", modal).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- form ---------- */
  function setError(name, msg) {
    var input = form.querySelector('[name="' + name + '"]');
    var box = form.querySelector('[data-error-for="' + name + '"]');
    if (input && input.type !== "checkbox") input.classList.toggle("is-invalid", !!msg);
    if (box) box.textContent = msg || "";
  }

  function digits(s) { return (s || "").replace(/[^0-9]/g, ""); }

  if (form) {
    form.addEventListener("input", function (e) {
      var t = e.target;
      if (t.name) setError(t.name, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = digits(form.phone.value);
      var email = form.email.value.trim();
      var agree = form.agree.checked;
      var ok = true;

      if (name.length < 2) { setError("name", "이름을 두 글자 이상 입력해 주세요."); ok = false; }
      if (phone.length < 9 || phone.length > 11) { setError("phone", "휴대폰 번호를 정확히 입력해 주세요."); ok = false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("email", "이메일 형식을 확인해 주세요."); ok = false; }
      if (!agree) { setError("agree", "확인에 체크해 주세요."); ok = false; }
      if (!ok) {
        var bad = form.querySelector(".is-invalid") || form.querySelector('[name="agree"]');
        if (bad) bad.focus();
        return;
      }

      var usedName = document.querySelector(".done-name");
      if (usedName) usedName.textContent = name;
      var no = "JK-" + String(Math.floor(100000 + Math.random() * 900000));
      var noEl = $("#doneNo");
      if (noEl) noEl.textContent = no;

      formStep.hidden = true;
      doneStep.hidden = false;
      doneStep.scrollTop = 0;
      var okBtn = doneStep.querySelector("[data-close-modal]");
      if (okBtn) setTimeout(function () { okBtn.focus(); }, 60);
    });

    form.addEventListener("reset", function () {
      ["name", "phone", "email", "agree"].forEach(function (n) { setError(n, ""); });
    });
  }

  /* ---------- phone auto-format ---------- */
  var phoneInput = form ? form.querySelector('[name="phone"]') : null;
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      var d = digits(phoneInput.value).slice(0, 11);
      var out = d;
      if (d.length > 3 && d.length <= 7) out = d.slice(0, 3) + "-" + d.slice(3);
      else if (d.length > 7) {
        out = d.length === 10
          ? d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6)
          : d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
      }
      if (out !== phoneInput.value) phoneInput.value = out;
    });
  }
})();
