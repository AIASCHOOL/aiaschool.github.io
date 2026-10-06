(function() {
  var backToTopButton = document.getElementById("backToTopButton");

  if (!backToTopButton) return;

  function updateBackToTopVisibility() {
    if (window.scrollY > 320) {
      backToTopButton.classList.add("is-visible");
    } else {
      backToTopButton.classList.remove("is-visible");
    }
  }

  backToTopButton.addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
  window.addEventListener("resize", updateBackToTopVisibility);
  updateBackToTopVisibility();
})();

(function() {
  var PARSE_URL = "https://parse3.infowin.com.tw/parse/classes/aiasoAlumni";
  var LOCALES = ["en", "cn", "tw", "ko", "vi", "th", "id", "np"];
  var COPY = {
    ja: {
      nameRequired: "名前を入力してください。",
      success: "送信しました。ありがとうございました。",
      failure: "送信に失敗しました。しばらくしてからもう一度お試しください。"
    },
    en: {
      nameRequired: "Please enter your name.",
      success: "Thank you. Your message has been sent.",
      failure: "Could not send your message. Please try again later."
    },
    cn: {
      nameRequired: "请填写姓名。",
      success: "已发送，感谢您的联系。",
      failure: "发送失败，请稍后再试。"
    },
    tw: {
      nameRequired: "請填寫姓名。",
      success: "已送出，感謝您的聯絡。",
      failure: "送出失敗，請稍後再試。"
    },
    ko: {
      nameRequired: "이름을 입력해 주세요.",
      success: "전송했습니다. 감사합니다.",
      failure: "전송에 실패했습니다. 잠시 후 다시 시도해 주세요."
    },
    vi: {
      nameRequired: "Vui lòng nhập tên.",
      success: "Đã gửi. Cảm ơn bạn.",
      failure: "Không gửi được. Vui lòng thử lại sau."
    },
    th: {
      nameRequired: "กรุณากรอกชื่อ",
      success: "ส่งแล้ว ขอบคุณค่ะ",
      failure: "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง"
    },
    id: {
      nameRequired: "Silakan isi nama.",
      success: "Terkirim. Terima kasih.",
      failure: "Gagal terkirim. Silakan coba lagi."
    },
    np: {
      nameRequired: "कृपया नाम लेख्नुहोस्।",
      success: "पठाइयो। धन्यवाद।",
      failure: "पठाउन सकिएन। कृपया पछि फेरि प्रयास गर्नुहोस्।"
    }
  };

  function localeFromPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    for (var i = 0; i < parts.length; i += 1) {
      if (LOCALES.indexOf(parts[i]) !== -1) return parts[i];
    }
    return "ja";
  }

  function fieldValue(form, name, maxLength) {
    var field = form.elements[name];
    var value = field ? String(field.value || "").trim() : "";
    return value.slice(0, maxLength);
  }

  function showStatus(form, message, isError) {
    var status = form.querySelector("[data-alumni-status]");
    if (!status) {
      status = document.createElement("p");
      status.setAttribute("data-alumni-status", "");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      var actions = form.querySelector(".text-right");
      if (actions) actions.insertAdjacentElement("afterend", status);
      else form.appendChild(status);
    }
    status.className = "mt-3 text-sm font-bold " + (isError ? "text-red-700" : "text-blue-900");
    status.textContent = message;
  }

  function isAlumniForm(form) {
    return form instanceof HTMLFormElement &&
      String(form.getAttribute("action") || "").indexOf("MAILTO:") === 0 &&
      form.elements.name;
  }

  async function submitAlumni(form) {
    var copy = COPY[localeFromPath()] || COPY.ja;
    var name = fieldValue(form, "name", 200);
    if (!name) {
      showStatus(form, copy.nameRequired, true);
      return;
    }

    var button = form.querySelector("button");
    if (form.dataset.sending === "1") return;
    form.dataset.sending = "1";
    if (button) button.disabled = true;

    try {
      var response = await fetch(PARSE_URL, {
        method: "POST",
        headers: {
          "X-Parse-Application-Id": "myappID",
          "X-Parse-JavaScript-Key": "infowin",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ACL: { "0vYjaAGtW2": { read: true, write: true } },
          name: name,
          period: fieldValue(form, "period", 200),
          position: fieldValue(form, "position", 300),
          sns: fieldValue(form, "sns", 300),
          comment: fieldValue(form, "comment", 4000),
          locale: localeFromPath(),
          scope: window.location.pathname.indexOf("/staging") !== -1 ? "staging" : "root"
        })
      });
      var result = await response.json();
      if (!response.ok || !result.objectId) throw new Error("save failed");
      form.reset();
      showStatus(form, copy.success, false);
    } catch (error) {
      showStatus(form, copy.failure, true);
    } finally {
      form.dataset.sending = "0";
      if (button) button.disabled = false;
    }
  }

  document.querySelectorAll("form[action^='MAILTO:']").forEach(function(form) {
    var button = form.querySelector("button");
    if (button) button.type = "submit";
  });

  document.addEventListener("submit", function(event) {
    if (!isAlumniForm(event.target)) return;
    event.preventDefault();
    submitAlumni(event.target);
  });
})();
