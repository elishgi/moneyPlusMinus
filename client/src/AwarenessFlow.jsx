import { useEffect, useMemo, useState } from "react";

const primaryQuestions = [
  {
    key: "incomeEstimate",
    title: "האם אתה יודע כמה אתה מרוויח בחודש?",
    helper: "כולל משכורות וכלל ההכנסות הקבועות",
    placeholder: "לדוגמה 12000",
  },
  {
    key: "fixedExpensesEstimate",
    title: "האם אתה יודע כמה אתה מוציא על הוצאות קבועות?",
    helper: "חשבונות, מנויים, שכירות, גנים ומעונות",
    placeholder: "לדוגמה 4200",
  },
  {
    key: "creditCardEstimate",
    title: "האם אתה יודע כמה אתה מוציא על שימוש בכרטיסי אשראי כרדיט בכל חודש?",
    helper: "סכום חיובי האשראי הדחויים",
    placeholder: "לדוגמה 2300",
  },
  {
    key: "debitCardEstimate",
    title: "האם אתה יודע לשער כמה אתה מוציא בחודש על כרטיסי אשראי חיוב מיידי?",
    helper: "עסקאות דביט/חיוב מיידי",
    placeholder: "לדוגמה 1200",
  },
];

const detailedQuestions = [
  {
    key: "fuelEstimate",
    title: "האם אתה יודע כמה מוציא על דלק?",
    placeholder: "לדוגמה 600",
  },
  {
    key: "groceriesEstimate",
    title: "האם אתה יודע כמה מוציא על קניות?",
    placeholder: "לדוגמה 2000",
  },
  {
    key: "treatsEstimate",
    title: "כמה מוציא על פינוקים?",
    placeholder: "לדוגמה 500",
  },
];

const defaultAwarenessData = {
  userName: "",
  isAware: null,
  incomeEstimate: "",
  fixedExpensesEstimate: "",
  creditCardEstimate: "",
  debitCardEstimate: "",
  deepAware: null,
  fuelEstimate: "",
  groceriesEstimate: "",
  treatsEstimate: "",
  completed: false,
};

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatILS(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("he-IL", { style: "currency", currency: "ILS" });
}

function QuestionCard({
  title,
  helper,
  value,
  onChange,
  onNext,
  showSkip,
  actionLabel = "לשאלה הבאה",
}) {
  return (
    <div className="card awarenessCard">
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">{title}</h2>
          {helper && <p className="cardSub">{helper}</p>}
        </div>
      </div>

      <div className="awarenessBody">
        <label className="field">
          <span className="label">סכום (₪)</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
          />
        </label>

        <div className="awarenessActions">
          {showSkip && (
            <button type="button" className="btn btnGhost" onClick={onNext}>
              דלג והמשך
            </button>
          )}
          <button type="button" className="btn btnPrimary" onClick={onNext}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AwarenessFlow({ data, onComplete, locked = false, onBackToBudget }) {
  const [form, setForm] = useState({ ...defaultAwarenessData, ...data });
  const [step, setStep] = useState(() =>
    locked || data?.completed ? "insights" : "intro"
  );
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [detailIndex, setDetailIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);

  const currentPrimaryQuestion = primaryQuestions[primaryIndex];
  const currentDetailQuestion = detailedQuestions[detailIndex];

  const progress = useMemo(() => {
    if (step === "intro") return 0;
    if (step === "primary") return (primaryIndex + 1) / primaryQuestions.length;
    if (step === "deepDive") return 1;
    if (step === "details")
      return (
        (primaryQuestions.length + detailIndex + 1) /
        (primaryQuestions.length + detailedQuestions.length)
      );
    if (step === "summary" || step === "insights") return 1;
    return 0;
  }, [step, primaryIndex, detailIndex]);

  const isReadOnly = locked || form.completed;

  const insights = useMemo(() => {
    const income = toNumber(form.incomeEstimate);
    const fixed = toNumber(form.fixedExpensesEstimate);
    const credit = toNumber(form.creditCardEstimate);
    const debit = toNumber(form.debitCardEstimate);
    const fuel = toNumber(form.fuelEstimate);
    const groceries = toNumber(form.groceriesEstimate);
    const treats = toNumber(form.treatsEstimate);

    const estimatedExpenses = fixed + credit + debit + fuel + groceries + treats;
    const estimatedBalance = income - estimatedExpenses;

    const fullyAnswered =
      form.isAware &&
      form.deepAware &&
      primaryQuestions.every((q) => toNumber(form[q.key]) > 0) &&
      detailedQuestions.every((q) => toNumber(form[q.key]) > 0);

    let tone = "בואו נצלול יחד";
    if (form.isAware && form.deepAware) tone = "רמת מודעות גבוהה!";
    else if (form.isAware) tone = "יש בסיס טוב";
    else tone = "נעזור לך לעשות סדר";

    let balanceMessage = "";
    if (estimatedBalance < 0) {
      balanceMessage =
        "ההוצאות עולות על ההכנסות לפי הערכתך. אנחנו כאן כדי לגלות איפה הכסף בורח ולתקן.";
    } else if (estimatedBalance >= 1000) {
      balanceMessage =
        "כל הכבוד! יש לך מרווח חיובי יפה. נמשיך לעזור לך לשמר ולהגדיל אותו.";
    } else {
      balanceMessage =
        "המצב מאוזן יחסית, ועדיין כדאי לבדוק איפה ניתן ללטש או לחסוך עוד קצת.";
    }

    return {
      income,
      estimatedExpenses,
      estimatedBalance,
      fullyAnswered,
      tone,
      balanceMessage,
    };
  }, [form]);

  useEffect(() => {
    if (isReadOnly) {
      setStep("insights");
    }
  }, [isReadOnly]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAwarenessChoice(isAware) {
    const next = { ...form, isAware };
    setForm(next);

    if (!isAware) {
      onComplete({ ...next, completed: true });
      return;
    }

    setStep("primary");
  }

  function handlePrimaryNext() {
    if (primaryIndex < primaryQuestions.length - 1) {
      setPrimaryIndex((idx) => idx + 1);
    } else {
      setStep("deepDive");
    }
  }

  function handleDeepDive(choice) {
    const next = { ...form, deepAware: choice };
    setForm(next);

    if (choice) {
      setStep("details");
      return;
    }

    setAcknowledged(false);
    setStep("explanation");
  }

  function handleDetailNext() {
    if (detailIndex < detailedQuestions.length - 1) {
      setDetailIndex((idx) => idx + 1);
    } else {
      setStep("insights");
    }
  }

  function handleComplete() {
    const payload = { ...form, completed: true };
    setForm(payload);
    setStep("insights");
    onComplete(payload);
  }

  return (
    <div className="app awarenessLayout">
      <header className="hero awarenessHero">
        <div className="heroTop">
          <div className="badge">בדיקת מודעות אישית</div>
          <div className="progressBar">
            <div className="progressTrack">
              <div
                className="progressValue"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="progressLabel">{Math.round(progress * 100)}% הושלמו</span>
          </div>
        </div>

        <h1 className="heroTitle">לפני שנתחיל להזין נתונים אמיתיים</h1>
        <p className="heroText">
          רגע לפני שממלאים את המחשבון, בואו נבדוק כמה אתם ערניים למצב הכלכלי שלכם.
          זה יעזור לנו להבין את רמת המודעות ולשמור את הנתונים להשוואה מול המספרים שתזינו
          בהמשך.
        </p>

        <label className="field awarenessNameField">
          <span className="label">שם המשתמש</span>
          <input
            className="input"
            type="text"
            placeholder="איך לפנות אליך?"
            value={form.userName}
            onChange={(e) => updateField("userName", e.target.value)}
            disabled={isReadOnly}
          />
        </label>
      </header>

      <main className="content awarenessContent">
        {step === "intro" && (
          <section className="card awarenessCard introCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">כמה אתה מודע להתנהלות הכלכלית שלך?</h2>
                <p className="cardSub">
                  נתחיל בבדיקה קצרה: אם אינך מרגיש מודע למתרחש, נוביל אותך מיד למחשבון התקציב.
                  אם אתה מרגיש מודע – נצלול לכמה שאלות ממוקדות.
                </p>
              </div>
            </div>

            <div className="awarenessChoices">
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => handleAwarenessChoice(true)}
              >
                אני מודע/ת ומוכן/ה לענות
              </button>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => handleAwarenessChoice(false)}
              >
                אני לא מספיק מודע/ת – עבור ישר למחשבון
              </button>
            </div>
          </section>
        )}

        {step === "primary" && (
          <QuestionCard
            title={currentPrimaryQuestion.title}
            helper={currentPrimaryQuestion.helper}
            value={form[currentPrimaryQuestion.key]}
            onChange={(value) => updateField(currentPrimaryQuestion.key, value)}
            onNext={handlePrimaryNext}
            showSkip
          />
        )}

        {step === "deepDive" && (
          <section className="card awarenessCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">יורדים עוד קצת לפרטים</h2>
                <p className="cardSub">
                  נשאל אותך עכשיו על מספרים ספציפיים יותר כדי להבין עד כמה אתה במעקב שוטף אחרי
                  ההוצאות וההכנסות.
                </p>
              </div>
            </div>

            <div className="awarenessChoices">
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => handleDeepDive(true)}
              >
                כן, בואו נמשיך לשאלות
              </button>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => handleDeepDive(false)}
              >
                אני פחות בשל/ה – תסבירו לי לפני שנמשיך
              </button>
            </div>
          </section>
        )}

        {step === "explanation" && (
          <section className="card awarenessCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">הסבר קצר לפני שמעמיקים</h2>
                <p className="cardSub">
                  נבקש ממך סכומים מפורטים יותר כדי לגבש תמונה מלאה של רמת המודעות הכלכלית שלך.
                  המידע הזה נשמר רק כדי להשוות מול הנתונים המדויקים שתזין בהמשך.
                </p>
              </div>
            </div>

            <div className="awarenessBody">
              <label className="acknowledgeRow">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>קראתי והבנתי, אפשר להמשיך לשאלות.</span>
              </label>

              <div className="awarenessActions">
                <button
                  type="button"
                  className="btn btnPrimary"
                  onClick={() => setStep("details")}
                  disabled={!acknowledged}
                >
                  המשך לשאלות הבאות
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "details" && (
          <QuestionCard
            title={currentDetailQuestion.title}
            value={form[currentDetailQuestion.key]}
            onChange={(value) => updateField(currentDetailQuestion.key, value)}
            onNext={handleDetailNext}
            showSkip
          />
        )}

        {step === "insights" && (
          <section className="card awarenessCard insightCard">
            <div className="insightHero">
              <div className="insightHalo" aria-hidden />
              <div className="insightTitleBlock">
                <div className="insightBadges">
                  <span className="pill glass">התובנות שלנו</span>
                  {insights.fullyAnswered && <span className="pill pillGood">ענית על הכל</span>}
                  {isReadOnly && <span className="pill pillInfo">הנתונים נעולים לעריכה</span>}
                </div>
                <h2 className="cardTitle">
                  {form.userName ? `${form.userName}, ` : ""}הנה מה שהבנו מהנתונים שלך
                </h2>
                <p className="cardSub">
                  {insights.tone}. אספנו את המספרים ששיתפת כדי לתת לך תמונת מצב חזותית ומהירה.
                </p>
                <div className="insightChips">
                  <span className="chip">מודעות כללית: {form.isAware ? "כן" : "לא"}</span>
                  <span className="chip">מודעות לפרטים: {form.deepAware ? "כן" : "לא"}</span>
                  <span className="chip">סך מקורות הוצאה שסיפקת: {formatILS(insights.estimatedExpenses)}</span>
                </div>
              </div>

              <div className="insightMeter">
                <div className="meterLabel">איזון משוער לפי מה שסיפרת</div>
                <div
                  className={`meterValue ${
                    insights.estimatedBalance > 0
                      ? "meterGood"
                      : insights.estimatedBalance < 0
                        ? "meterBad"
                        : ""
                  }`}
                >
                  {formatILS(insights.estimatedBalance)}
                </div>
                <p className="meterText">{insights.balanceMessage}</p>
              </div>
            </div>

            <div className="insightGrid">
              <div className="insightBox highlight">
                <div className="insightBoxLabel">הכנסות שהוזנו</div>
                <div className="insightBoxValue">{formatILS(insights.income)}</div>
                <p className="insightBoxText">
                  שיתפת אותנו כמה כסף נכנס בכל חודש. נשתמש בזה כדי להשוות מול ההוצאות.
                </p>
              </div>

              <div className="insightBox highlight soft">
                <div className="insightBoxLabel">הוצאות שהוזנו</div>
                <div className="insightBoxValue">{formatILS(insights.estimatedExpenses)}</div>
                <p className="insightBoxText">
                  שילבת הוצאות קבועות, אשראי, דלק, קניות ופינוקים כדי לקבל תמונה מלאה.
                </p>
              </div>

              <div className="insightBox">
                <div className="insightBoxLabel">מה הבנו ממך</div>
                <ul className="insightList">
                  <li>הכנסה חודשית משוערת: {form.incomeEstimate || "—"}</li>
                  <li>הוצאה חודשית כוללת לפי ההערכות שלך: {formatILS(insights.estimatedExpenses)}</li>
                  <li>
                    פידבק מיידי: {insights.estimatedBalance < 0
                      ? "אנחנו נלווה אותך במציאת הדליפות"
                      : "נמשיך לחזק את מה שעובד"}
                  </li>
                </ul>
              </div>

              <div className="insightBox">
                <div className="insightBoxLabel">הכוונה להמשך</div>
                <p className="insightBoxText">{insights.balanceMessage}</p>
                <p className="insightBoxText soft">
                  הדף הבא של המחשבון ישווה בין ההערכות האלו לבין המספרים המדויקים שתקליד.
                  זה יעזור לנו לתרגם מודעות לפעולה.
                </p>
              </div>
            </div>

            <div className="awarenessActions insightActions">
              {!isReadOnly && (
                <button type="button" className="btn btnPrimary" onClick={handleComplete}>
                  שמור והמשך למחשבון התקציב הביתי
                </button>
              )}

              {isReadOnly && onBackToBudget && (
                <button type="button" className="btn btnPrimary" onClick={onBackToBudget}>
                  חזרה למחשבון התקציב
                </button>
              )}

              {isReadOnly && (
                <div className="insightLockText">
                  הנתונים ננעלו כדי לשמור על הרצף. תרצה לעדכן אותם? אפשר לאפס מהמסך הראשי.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export { defaultAwarenessData };
