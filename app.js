/**
 * [보안 주석 - 중요]
 * - 이 파일(프론트엔드)에는 Gemini API 키를 절대 넣지 않습니다.
 *   API 키를 여기에 넣으면 브라우저 개발자 도구(Network 탭)에서 누구나 볼 수 있습니다.
 * - Gemini API 호출은 /api/gemini-counseling.js (Vercel Serverless Function)에서만 처리합니다.
 * - .env / .env.local 파일은 GitHub에 올리지 않습니다. (.gitignore 설정 확인 필수)
 * - Vercel 배포 시: Project Settings → Environment Variables → GEMINI_API_KEY 등록 필요.
 * - Gemini로 전송하는 데이터: studentAlias, gradeSummary, learningTraits, teacherConcern만 전송.
 *   학생 이름·학번·사진 경로·비밀번호는 절대 전송하지 않습니다.
 */

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;

// 현재 선택된 상담 학생 (익명화 인덱스 포함)
let selectedCounselingStudent = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  selectedCounselingStudent = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map((student, index) => renderStudentCard(student, index)).join("")}
    </section>

    ${renderCounselingPanel()}
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");

  // 상담 전략 요청 버튼 이벤트 연결
  STUDENTS.forEach((student, index) => {
    const btn = document.getElementById(`counselingBtn-${student.id}`);
    if (btn) {
      btn.addEventListener("click", () => selectStudentForCounseling(student, index));
    }
  });

  // AI 상담 전략 받기 버튼 이벤트 연결
  const aiBtn = document.getElementById("aiCounselingSubmitBtn");
  if (aiBtn) {
    aiBtn.addEventListener("click", handleAICounselingRequest);
  }

  // 교사 고민 입력 시 미리보기 실시간 업데이트
  const concernInput = document.getElementById("teacherConcernInput");
  if (concernInput) {
    concernInput.addEventListener("input", updatePreview);
  }
}

function renderStudentCard(student, index) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <div class="counseling-btn-wrap">
          <button
            id="counselingBtn-${student.id}"
            class="counseling-request-btn"
            type="button"
            aria-label="${student.name} 학생 상담 전략 요청"
          >
            🤖 상담 전략 요청
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

// ─── AI 상담 패널 렌더링 ────────────────────────────────────────────────────

function renderCounselingPanel() {
  return `
    <section class="ai-counseling-panel" aria-labelledby="aiCounselingTitle">
      <div class="ai-panel-header">
        <div>
          <p class="eyebrow">AI Assistant</p>
          <h2 id="aiCounselingTitle">🤖 AI 학생 상담 전략 도우미</h2>
          <p class="ai-panel-desc">학생 카드의 <strong>상담 전략 요청</strong> 버튼을 누르고, 상담 고민을 입력하면 AI가 전략을 제안합니다.</p>
        </div>
      </div>

      <!-- 선택된 학생 표시 영역 -->
      <div id="selectedStudentArea" class="selected-student-area">
        <div class="no-student-selected">
          <span class="no-student-icon">👆</span>
          <p>위 학생 카드에서 <strong>상담 전략 요청</strong> 버튼을 눌러 학생을 선택해 주세요.</p>
        </div>
      </div>

      <!-- 교사 고민 입력 -->
      <div class="concern-input-area" id="concernInputArea" style="display:none;">
        <label for="teacherConcernInput" class="concern-label">📝 상담 고민 입력</label>
        <textarea
          id="teacherConcernInput"
          class="concern-textarea"
          rows="4"
          placeholder="예시:&#10;• 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?&#10;• 과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?&#10;• 친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?"
        ></textarea>

        <!-- 전송 데이터 미리보기 -->
        <div class="preview-area">
          <p class="preview-label">📦 전송 데이터 미리보기 <span class="preview-badge">이름·학번·사진 경로 제외됨</span></p>
          <pre id="dataPreview" class="data-preview-code">{}</pre>
        </div>

        <!-- 오류 메시지 -->
        <p id="counselingErrorMsg" class="counseling-error-msg" role="alert" aria-live="polite"></p>

        <!-- 제출 버튼 -->
        <button id="aiCounselingSubmitBtn" class="ai-submit-btn" type="button">
          ✨ AI 상담 전략 받기
        </button>
      </div>

      <!-- 로딩 & 결과 영역 -->
      <div id="aiResultArea" class="ai-result-area" style="display:none;">
        <div id="aiLoadingMsg" class="ai-loading" style="display:none;">
          <span class="loading-spinner"></span>
          AI가 상담 전략을 생성하는 중입니다…
        </div>
        <div id="aiResultContent" class="ai-result-content"></div>
      </div>

      <!-- 하단 안내 문구 -->
      <p class="ai-disclaimer">
        ⚠️ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
      </p>
    </section>
  `;
}

// ─── 학생 선택 처리 ────────────────────────────────────────────────────────

function selectStudentForCounseling(student, index) {
  // 익명화 별칭: 학생 A, 학생 B, 학생 C ...
  const aliases = ["학생 A", "학생 B", "학생 C", "학생 D", "학생 E"];
  const alias = aliases[index] || `학생 ${String.fromCharCode(65 + index)}`;

  // Gemini 전송용 익명화 데이터 생성 (이름·학번·사진·비밀번호 제외)
  const gradeSummary = Object.entries(student.grades)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const learningTraits = [...student.traits, student.teacherMemo].join(" / ");

  selectedCounselingStudent = {
    // 화면 표시용 (프론트엔드에서만 사용)
    displayName: student.name,
    displayId: student.id,
    // Gemini 전송용 익명화 데이터
    studentAlias: alias,
    gradeSummary: gradeSummary,
    learningTraits: learningTraits,
  };

  // 선택된 학생 UI 업데이트
  const area = document.getElementById("selectedStudentArea");
  if (area) {
    area.innerHTML = `
      <div class="selected-student-info">
        <div class="selected-badge">선택된 학생</div>
        <div class="selected-student-row">
          <div class="selected-display">
            <span class="selected-icon">👤</span>
            <div>
              <p class="selected-name">${student.name}</p>
              <p class="selected-num">학번 ${student.id}</p>
            </div>
          </div>
          <div class="selected-arrow">→</div>
          <div class="selected-anon">
            <span class="selected-icon anon-icon">🔒</span>
            <div>
              <p class="selected-alias">${alias}</p>
              <p class="selected-anon-label">AI 전송용 익명 이름</p>
            </div>
          </div>
        </div>
        <p class="selected-privacy-note">✅ Gemini API에는 학생 이름·학번·사진 경로가 전송되지 않습니다.</p>
      </div>
    `;
  }

  // 고민 입력 영역 표시
  const concernArea = document.getElementById("concernInputArea");
  if (concernArea) {
    concernArea.style.display = "block";
  }

  // 이전 결과 초기화
  const resultArea = document.getElementById("aiResultArea");
  if (resultArea) {
    resultArea.style.display = "none";
  }
  const resultContent = document.getElementById("aiResultContent");
  if (resultContent) {
    resultContent.innerHTML = "";
  }

  // 고민 입력 초기화 및 미리보기 초기화
  const concernInput = document.getElementById("teacherConcernInput");
  if (concernInput) {
    concernInput.value = "";
  }
  updatePreview();

  // 오류 메시지 초기화
  const errMsg = document.getElementById("counselingErrorMsg");
  if (errMsg) {
    errMsg.textContent = "";
  }

  // 상담 패널로 스크롤
  const panel = document.querySelector(".ai-counseling-panel");
  if (panel) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─── 전송 데이터 미리보기 업데이트 ────────────────────────────────────────

function updatePreview() {
  const previewEl = document.getElementById("dataPreview");
  if (!previewEl || !selectedCounselingStudent) return;

  const teacherConcern = (document.getElementById("teacherConcernInput") || {}).value || "";

  // 미리보기에는 이름·학번·사진 경로 포함 안 됨
  const previewData = {
    studentAlias: selectedCounselingStudent.studentAlias,
    gradeSummary: selectedCounselingStudent.gradeSummary,
    learningTraits: selectedCounselingStudent.learningTraits,
    teacherConcern: teacherConcern || "(아직 입력되지 않음)",
  };

  previewEl.textContent = JSON.stringify(previewData, null, 2);
}

// ─── AI 상담 전략 요청 처리 ────────────────────────────────────────────────

async function handleAICounselingRequest() {
  const errMsg = document.getElementById("counselingErrorMsg");
  const loadingMsg = document.getElementById("aiLoadingMsg");
  const resultArea = document.getElementById("aiResultArea");
  const resultContent = document.getElementById("aiResultContent");
  const submitBtn = document.getElementById("aiCounselingSubmitBtn");
  const concernInput = document.getElementById("teacherConcernInput");

  if (!errMsg || !loadingMsg || !resultArea || !resultContent || !submitBtn || !concernInput) return;

  // 오류 초기화
  errMsg.textContent = "";

  // 학생 선택 여부 확인
  if (!selectedCounselingStudent) {
    errMsg.textContent = "학생을 먼저 선택해 주세요.";
    return;
  }

  // 교사 고민 입력 확인
  const teacherConcern = concernInput.value.trim();
  if (!teacherConcern) {
    errMsg.textContent = "상담 고민을 먼저 입력해주세요.";
    concernInput.focus();
    return;
  }

  // 전송 데이터 구성 (개인정보 제외 - 이름·학번·사진 경로·비밀번호 없음)
  const requestBody = {
    studentAlias: selectedCounselingStudent.studentAlias,
    gradeSummary: selectedCounselingStudent.gradeSummary,
    learningTraits: selectedCounselingStudent.learningTraits,
    teacherConcern: teacherConcern,
  };

  // UI 로딩 상태
  submitBtn.disabled = true;
  submitBtn.textContent = "⏳ 요청 중...";
  resultArea.style.display = "block";
  loadingMsg.style.display = "flex";
  resultContent.innerHTML = "";

  try {
    /**
     * [보안] 프론트엔드는 /api/gemini-counseling으로만 요청합니다.
     * API 키는 Vercel Serverless Function(서버 측)에서만 사용합니다.
     */
    const response = await fetch("/api/gemini-counseling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    loadingMsg.style.display = "none";

    if (data.success && data.result) {
      resultContent.innerHTML = formatAIResponse(data.result);
    } else {
      resultContent.innerHTML = `
        <div class="ai-error-box">
          <p>❌ AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.</p>
          <p class="ai-error-detail">${data.error || "알 수 없는 오류"}</p>
        </div>
      `;
    }
  } catch (fetchError) {
    loadingMsg.style.display = "none";
    resultContent.innerHTML = `
      <div class="ai-error-box">
        <p>❌ AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.</p>
        <p class="ai-error-detail">네트워크 오류: ${fetchError.message}</p>
      </div>
    `;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "✨ AI 상담 전략 받기";
  }
}

// ─── Gemini 응답 텍스트 → HTML 변환 ──────────────────────────────────────

function formatAIResponse(text) {
  // 마크다운 형식의 응답을 HTML로 변환
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const formatted = escaped
    // ## 제목 → h3
    .replace(/^## (.+)$/gm, '<h3 class="ai-res-h2">$1</h3>')
    // # 제목 → h3
    .replace(/^# (.+)$/gm, '<h3 class="ai-res-h1">$1</h3>')
    // 숫자. 로 시작하는 섹션 제목 강조
    .replace(/^(\d+\.\s)(\*\*(.+?)\*\*|(.+))$/gm, (_, num, bold, b1, b2) => {
      const title = b1 || b2;
      return `<p class="ai-section-title"><strong>${num}${title}</strong></p>`;
    })
    // **굵게**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *이탤릭*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // - 목록 항목
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // li 묶기
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="ai-res-list">${match}</ul>`)
    // 빈 줄 → 단락 구분
    .replace(/\n\n+/g, '</p><p class="ai-res-p">')
    // 단일 줄바꿈
    .replace(/\n/g, "<br>");

  return `<div class="ai-result-formatted"><p class="ai-res-p">${formatted}</p></div>`;
}

showOnly(loginView);
