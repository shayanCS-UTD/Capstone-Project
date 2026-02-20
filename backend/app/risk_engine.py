"""
Rule-based risk classification engine.

Analyzes request title + description for risk keywords and returns a
RiskAnalysis result used to drive the approval workflow.
"""

from app.models import RiskAnalysis, RiskLevel

HIGH_RISK_KEYWORDS = [
    "urgent", "emergency", "override", "bypass", "admin", "root",
    "privilege", "escalate", "unrestricted", "sensitive", "confidential",
    "executive", "ceo", "board", "unlimited", "mass", "bulk",
    "all users", "system-wide",
]

MEDIUM_RISK_KEYWORDS = [
    "temporary", "extended", "multiple", "large", "all day",
    "overnight", "weekend", "special", "exception",
]


def classify_risk(title: str, description: str) -> RiskAnalysis:
    """
    Classify a request by scanning title and description for risk keywords.

    Scoring:
      - Each HIGH keyword match adds 20 points (capped at 100).
      - Each MEDIUM keyword match adds 10 points.
    Final level: HIGH >= 60, MEDIUM >= 20, else LOW.
    """
    combined = f"{title} {description}".lower()

    matched_high = [kw for kw in HIGH_RISK_KEYWORDS if kw in combined]
    matched_medium = [kw for kw in MEDIUM_RISK_KEYWORDS if kw in combined]

    score = min(len(matched_high) * 20 + len(matched_medium) * 10, 100)
    risk_factors = matched_high + matched_medium

    if score >= 60 or matched_high:
        level = RiskLevel.HIGH
        # Ensure score reflects high risk even on a single keyword match
        if score < 60:
            score = 60
    elif score >= 20 or matched_medium:
        level = RiskLevel.MEDIUM
        if score < 20:
            score = 20
    else:
        level = RiskLevel.LOW

    return RiskAnalysis(
        risk_level=level,
        risk_score=score,
        risk_factors=risk_factors,
    )
