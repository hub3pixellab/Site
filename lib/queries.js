/**
 * GROQ queries centralizadas. Mantidas em texto puro para serem
 * usadas tanto em route handlers (server) quanto via fetch HTTP.
 */

export const topLeadsQuery = `
  *[_type == "lead"] | order(score desc)[0...10] {
    "_id": _id,
    nickname,
    score,
    timestamp
  }
`;

export const findLeadByNicknameQuery = `
  *[_type == "lead" && nickname == $nickname][0] {
    _id, nickname, email, phone, score, timestamp
  }
`;

export const matchmakerQuestionsQuery = `
  *[_type == "matchmaker"] | order(sortOrder asc) {
    "_id": _id,
    "questionId": questionId.current,
    cardText,
    yesVector,
    noVector,
    sortOrder
  }
`;

export const portfolioProjectsQuery = `
  *[_type == "project"] | order(_createdAt desc) {
    "_id": _id,
    title,
    division,
    "caseSlug": caseSlug.current,
    description,
    marketVertical,
    blockChainTech,
    smartContractsUsed,
    liveUrl,
    tags,
    metrics
  }
`;
