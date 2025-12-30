import { useMemo, useState } from "react";

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

export default function AwarenessFlow({ data, onComplete }) {
  const [form, setForm] = useState({ ...defaultAwarenessData, ...data });
  const [step, setStep] = useState("intro");
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
    if (step === "summary") return 1;
    return 0;
  }, [step, primaryIndex, detailIndex]);

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
      setStep("summary");
    }
  }

  function handleComplete() {
    onComplete({ ...form, completed: true });
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

        {step === "summary" && (
          <section className="card awarenessCard summaryCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">תודה על השיתוף!</h2>
                <p className="cardSub">
                  ריכזנו את המספרים שהזנת. נשמור אותם וכשתלחץ "שמור והמשך" נעביר אותך למחשבון
                  התקציב הביתי.
                </p>
              </div>
            </div>

            <div className="summaryGrid">
              <div className="summaryItem">
                <span className="label">מודעות כללית</span>
                <strong>{form.isAware ? "מודע" : "לא מודע"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">מודעות לפרטים הקטנים</span>
                <strong>{form.deepAware ? "כן" : "לא"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">כמה מרוויח?</span>
                <strong>{form.incomeEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">הוצאות קבועות</span>
                <strong>{form.fixedExpensesEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">אשראי כרדיט</span>
                <strong>{form.creditCardEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">אשראי חיוב מיידי</span>
                <strong>{form.debitCardEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">דלק</span>
                <strong>{form.fuelEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">קניות</span>
                <strong>{form.groceriesEstimate || "—"}</strong>
              </div>
              <div className="summaryItem">
                <span className="label">פינוקים</span>
                <strong>{form.treatsEstimate || "—"}</strong>
              </div>
            </div>

            <div className="awarenessActions">
              <button type="button" className="btn btnPrimary" onClick={handleComplete}>
                שמור והמשך למחשבון התקציב הביתי
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export { defaultAwarenessData };
