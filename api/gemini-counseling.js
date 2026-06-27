/**
 * [보안 주석]
 * - 프론트엔드에 API 키를 넣으면 브라우저 개발자 도구(Network 탭)에서 즉시 노출됩니다.
 * - Gemini API 호출은 반드시 이 Vercel Serverless Function에서만 처리합니다.
 * - .env / .env.local 파일은 절대 GitHub에 올리지 않습니다. (.gitignore 확인 필수)
 * - Vercel 배포 시: Project Settings → Environment Variables → GEMINI_API_KEY 등록 필요.
 * - Gemini로 전송하는 데이터는 학생 이름·학번·사진 경로·비밀번호를 제외한 최소 정보로만 제한합니다.
 */

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST 요청만 허용됩니다." });
  }

  // 환경 변수에서 API 키 읽기 (절대 코드에 직접 적지 않음)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.",
    });
  }

  // 요청 body에서 필수 값 추출
  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body || {};

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error: "studentAlias, gradeSummary, learningTraits, teacherConcern 값이 모두 필요합니다.",
    });
  }

  // Gemini에게 보낼 프롬프트 구성
  const prompt = `당신은 학교 현장에서 교사를 돕는 학생 상담 전략 도우미입니다.
아래는 익명화된 학생 데이터와 교사의 상담 고민입니다. 개인정보는 포함되지 않았습니다.

[학생 정보]
- 학생 별칭: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성: ${learningTraits}
- 교사 상담 고민: ${teacherConcern}

위 정보를 바탕으로 교사가 학생을 더 잘 이해하고 대화할 수 있도록 아래 형식에 맞춰 상담 전략을 제안해 주세요.

[응답 형식 - 반드시 아래 6가지 항목을 모두 포함하세요]

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원

[중요 원칙]
- 학생을 단정하거나 진단하는 표현("의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다" 등)을 절대 사용하지 마세요.
- 교사가 학생을 이해하고 자연스럽게 대화를 열 수 있도록 돕는 방향으로 제안해 주세요.
- 제안은 참고용이며, 최종 판단은 교사가 학생의 상황을 직접 보고 결정한다는 점을 인식하고 응답해 주세요.
- 한국어로 응답해 주세요.`;

  // Gemini REST API 호출 (Node.js 내장 fetch 사용, SDK 미사용)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return res.status(502).json({
        success: false,
        error: `Gemini API 오류 (${geminiResponse.status}): ${errText}`,
      });
    }

    const data = await geminiResponse.json();
    const resultText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "응답 내용을 가져올 수 없습니다.";

    return res.status(200).json({ success: true, result: resultText });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `서버 오류가 발생했습니다: ${err.message}`,
    });
  }
}
