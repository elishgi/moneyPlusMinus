import { useEffect, useMemo, useState } from "react";
import AwarenessFlow, { defaultAwarenessData } from "./AwarenessFlow";

const STORAGE_KEY = "budget-landing-v1";
const AWARENESS_STORAGE_KEY = "budget-awareness-v1";

function loadAwarenessFromStorage() {
  try {
    const raw = localStorage.getItem(AWARENESS_STORAGE_KEY);
    if (!raw) return { data: defaultAwarenessData, completed: false };

    const parsed = JSON.parse(raw);
    return {
      data: { ...defaultAwarenessData, ...parsed },
      completed: Boolean(parsed?.completed),
    };
  } catch {
    return { data: defaultAwarenessData, completed: false };
  }
}

const defaultIncomeTemplates = [
  { label: "משכורת 1" },
  { label: "משכורת 2" },
];

const defaultExpenseTemplates = [
  { label: "שכירות", lockDetails: true },
  { label: "חשבונות (מים, חשמל וכו)", lockDetails: false },
  { label: "מנויים", lockDetails: false },
  { label: "מעשרות", lockDetails: false },
];

const defaultCreditTemplates = [{ label: "כרטיס אשראי 1", lockDetails: true }];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toNumber(value) {
  // תומך גם בהקלדה עם פסיקים/רווחים
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatILS(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("he-IL", { style: "currency", currency: "ILS" });
}

function calcItemAmount(item) {
  if (Array.isArray(item?.details) && item.details.length > 0) {
    return item.details.reduce((sum, detail) => sum + toNumber(detail.amount), 0);
  }

  return toNumber(item?.amount);
}

function calcSum(items) {
  return items.reduce((sum, item) => sum + calcItemAmount(item), 0);
}

function normalizeDetails(details) {
  if (!Array.isArray(details)) return [];

  return details
    .filter((detail) => detail && typeof detail === "object")
    .map((detail) => ({
      id: detail.id || uid(),
      label: typeof detail.label === "string" ? detail.label : "",
      amount:
        typeof detail.amount === "number" || typeof detail.amount === "string"
          ? String(detail.amount)
          : "",
    }));
}

function normalizeItems(items, buildDefaults) {
  if (!Array.isArray(items)) return buildDefaults();

  const normalized = items
    .filter((item) => item && typeof item === "object")
    .map((item, idx) => ({
      id: item.id || uid(),
      label: typeof item.label === "string" ? item.label : `שורה ${idx + 1}`,
      amount:
        typeof item.amount === "number" || typeof item.amount === "string"
          ? String(item.amount)
          : "",
      details: normalizeDetails(item.details),
      lockDetails: Boolean(item.lockDetails),
      showDetails: Boolean(item.showDetails && !item.lockDetails),
    }))
    .map((item) =>
      item.lockDetails || item.label === "שכירות"
        ? { ...item, showDetails: false }
        : item
    );

  return normalized.length > 0 ? normalized : buildDefaults();
}

function buildDefaultItems(templates) {
  return templates.map((template) => ({
    id: uid(),
    label: template.label,
    amount: "",
    details: [],
    lockDetails: Boolean(template.lockDetails),
  }));
}

function Section({ title, subtitle, items, setItems, kind, createItem }) {
  const isIncome = kind === "income";

  const defaultLabel = isIncome ? "משכורת" : "הוצאה חדשה";
  const buildItem =
    typeof createItem === "function"
      ? createItem
      : () => ({ id: uid(), label: defaultLabel, amount: "", details: [] });

  function toggleDetails(id) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, showDetails: !x.showDetails } : x
      )
    );
  }

  function addRow() {
    setItems((prev) => [...prev, buildItem()]);
  }

  function removeRow(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function updateRow(id, patch) {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }

  function syncAmount(details) {
    const total = calcSum(details);
    return String(total);
  }

  function addDetailRow(parentId) {
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.id !== parentId ||
          item.lockDetails ||
          item.label === "שכירות"
        )
          return item;

        const nextDetails = [...(item.details || []), { id: uid(), label: "", amount: "" }];
        return {
          ...item,
          details: nextDetails,
          showDetails: true,
          amount: syncAmount(nextDetails),
        };
      })
    );
  }

  function updateDetailRow(parentId, detailId, patch) {
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.id !== parentId ||
          item.lockDetails ||
          item.label === "שכירות"
        )
          return item;

        const nextDetails = (item.details || []).map((detail) =>
          detail.id === detailId ? { ...detail, ...patch } : detail
        );

        return {
          ...item,
          details: nextDetails,
          amount: syncAmount(nextDetails),
        };
      })
    );
  }

  function removeDetailRow(parentId, detailId) {
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.id !== parentId ||
          item.lockDetails ||
          item.label === "שכירות"
        )
          return item;

        const nextDetails = (item.details || []).filter(
          (detail) => detail.id !== detailId
        );

        return {
          ...item,
          details: nextDetails,
          amount: syncAmount(nextDetails),
        };
      })
    );
  }

  return (
    <section className="card">
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">{title}</h2>
          <p className="cardSub">{subtitle}</p>
        </div>

        <button className="btn btnGhost" type="button" onClick={addRow}>
          + הוסף {isIncome ? "הכנסה" : "הוצאה"}
        </button>
      </div>

      <div className="list">
        {items.map((row, idx) => (
          <div className="row" key={row.id}>
            <div className="rowIndex">{idx + 1}</div>

            <label className="field">
              <span className="label">תיאור</span>
              <input
                className="input"
                type="text"
                value={row.label}
                placeholder={isIncome ? "למשל: משכורת, קצבה..." : "למשל: שכירות, חשמל..."}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="label">סכום (₪)</span>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                value={
                  Array.isArray(row.details) && row.details.length > 0
                    ? calcSum(row.details)
                    : row.amount
                }
                placeholder="0"
                onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                disabled={
                  !isIncome &&
                  Array.isArray(row.details) &&
                  row.details.length > 0 &&
                  !(row.lockDetails || row.label === "שכירות")
                }
              />
              {!isIncome &&
                Array.isArray(row.details) &&
                row.details.length > 0 &&
                !(row.lockDetails || row.label === "שכירות") && (
                  <span className="helperText">הסכום מחושב מסך הפריטים בפירוט.</span>
                )}
            </label>

            {!isIncome && !(row.lockDetails || row.label === "שכירות") && (
              <button
                className="btn btnGhost btnSmall"
                type="button"
                onClick={() => toggleDetails(row.id)}
              >
                {row.showDetails ? "סגור פירוט" : "פירוט"}
              </button>
            )}

            <button
              className="btn btnDanger"
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label="מחיקת שורה"
              title="מחק"
            >
              ✕
            </button>

            {!isIncome && !(row.lockDetails || row.label === "שכירות") && row.showDetails && (
              <div className="detailBox">
                <div className="detailBoxHeader">
                  <div className="detailTitle">פירוט עבור {row.label || "הוצאה"}</div>
                  <div className="detailTotal">סה״כ: {formatILS(calcSum(row.details || []))}</div>
                </div>

                <div className="detailList">
                  {(row.details || []).map((detail) => (
                    <div className="detailRow" key={detail.id}>
                      <label className="field">
                        <span className="label">שם פריט</span>
                        <input
                          className="input"
                          type="text"
                          value={detail.label}
                          placeholder="למשל: נטפליקס"
                          onChange={(e) =>
                            updateDetailRow(row.id, detail.id, {
                              label: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        <span className="label">סכום (₪)</span>
                        <input
                          className="input"
                          type="number"
                          inputMode="numeric"
                          value={detail.amount}
                          placeholder="0"
                          onChange={(e) =>
                            updateDetailRow(row.id, detail.id, {
                              amount: e.target.value,
                            })
                          }
                        />
                      </label>

                      <button
                        className="btn btnDanger btnSmall"
                        type="button"
                        aria-label="מחיקת פריט פירוט"
                        title="מחק פריט"
                        onClick={() => removeDetailRow(row.id, detail.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {(row.details || []).length === 0 && (
                    <div className="empty">לא הוספת פריטים עדיין.</div>
                  )}

                  <div className="detailActions">
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => addDetailRow(row.id)}
                    >
                      + הוסף פריט פירוט
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="empty">
            אין עדיין שורות. לחץ על “הוסף” כדי להתחיל.
          </div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const awarenessFromStorage = useMemo(() => loadAwarenessFromStorage(), []);
  const [awarenessData, setAwarenessData] = useState(awarenessFromStorage.data);
  const [showBudget, setShowBudget] = useState(awarenessFromStorage.completed);

  const [monthLabel, setMonthLabel] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
  });

  const [incomes, setIncomes] = useState(() =>
    buildDefaultItems(defaultIncomeTemplates)
  );

  const [expenses, setExpenses] = useState(() =>
    buildDefaultItems(defaultExpenseTemplates)
  );

  const [previousCredit, setPreviousCredit] = useState(() =>
    buildDefaultItems(defaultCreditTemplates)
  );

  const [didCalculate, setDidCalculate] = useState(false);
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    const payload = { ...awarenessData, completed: showBudget };
    localStorage.setItem(AWARENESS_STORAGE_KEY, JSON.stringify(payload));
  }, [awarenessData, showBudget]);

  function handleAwarenessComplete(payload) {
    setAwarenessData(payload);
    setShowBudget(true);
  }

  // טעינה מ-LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.monthLabel) setMonthLabel(parsed.monthLabel);

      setIncomes(() =>
        normalizeItems(parsed?.incomes, () => buildDefaultItems(defaultIncomeTemplates))
      );
      setExpenses(() =>
        normalizeItems(parsed?.expenses, () => buildDefaultItems(defaultExpenseTemplates))
      );
      setPreviousCredit(() =>
        normalizeItems(parsed?.previousCredit, () =>
          buildDefaultItems(defaultCreditTemplates)
        )
      );
    } catch {
      // מתעלמים — אם יש JSON לא תקין
    }
  }, []);

  // שמירה אוטומטית
  useEffect(() => {
    const payload = { monthLabel, incomes, expenses, previousCredit };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [monthLabel, incomes, expenses, previousCredit]);

  const totalIncome = useMemo(() => calcSum(incomes), [incomes]);
  const totalPreviousCredit = useMemo(() => calcSum(previousCredit), [previousCredit]);
  const totalExpense = useMemo(
    () => calcSum(expenses) + totalPreviousCredit,
    [expenses, totalPreviousCredit]
  );
  const remaining = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const combinedExpenses = useMemo(
    () => [...expenses, ...previousCredit],
    [expenses, previousCredit]
  );

  const expenseSegments = useMemo(() => {
    const total = calcSum(combinedExpenses);
    if (!total) return [];

    const palette = ["#6c5ce7", "#ff8b5f", "#20bfa9", "#ffa940", "#4e54c8", "#8e44ad"];
    let startAt = 0;

    return combinedExpenses
      .map((item, idx) => ({
        id: item.id,
        label: item.label || `הוצאה ${idx + 1}`,
        value: calcItemAmount(item),
      }))
      .filter((seg) => seg.value > 0)
      .map((seg, idx) => {
        const share = seg.value / total;
        const start = startAt;
        const end = startAt + share * 360;
        startAt = end;

        return {
          ...seg,
          color: palette[idx % palette.length],
          start,
          end,
          percent: Math.round(share * 100),
        };
      });
  }, [combinedExpenses]);

  const pieGradient = useMemo(() => {
    if (!expenseSegments.length) {
      return "radial-gradient(circle at 30% 30%, #eef0ff, #dfe4ff)";
    }

    const segments = expenseSegments
      .map((seg) => `${seg.color} ${seg.start}deg ${seg.end}deg`)
      .join(", ");

    return `conic-gradient(${segments})`;
  }, [expenseSegments]);

  function handleCalculate() {
    setDidCalculate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveBudget() {
    setSaveState({ status: "saving", message: "" });

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthLabel,
          totalIncome,
          totalExpenses: totalExpense,
          remaining,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.message || "שמירת הנתונים נכשלה";
        throw new Error(message);
      }

      setSaveState({
        status: "success",
        message: "הנתונים נשמרו בהצלחה בבסיס הנתונים.",
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error.message || "שמירת הנתונים נכשלה.",
      });
    }
  }

  function resetAll() {
    setDidCalculate(false);
    setMonthLabel(() => {
      const d = new Date();
      return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
    });
    setIncomes(buildDefaultItems(defaultIncomeTemplates));
    setExpenses(buildDefaultItems(defaultExpenseTemplates));
    setPreviousCredit(buildDefaultItems(defaultCreditTemplates));
    localStorage.removeItem(STORAGE_KEY);
  }

  const remainingClass =
    remaining > 0 ? "pill pillGood" : remaining < 0 ? "pill pillBad" : "pill";

  if (!showBudget) {
    return <AwarenessFlow data={awarenessData} onComplete={handleAwarenessComplete} />;
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="heroTop">
          <div className="badge">מחשבון תקציב ביתי</div>
          <div className="heroActionsInline">
            <button
              className="btn btnGhost"
              type="button"
              onClick={() => setShowBudget(false)}
            >
              חזרה לשאלון מודעות
            </button>
            <button className="btn btnGhost" type="button" onClick={resetAll}>
              איפוס
            </button>
          </div>
        </div>

        <h1 className="heroTitle">תמונה מהירה של הכסף שלך לחודש</h1>
        <p className="heroText">
          הזן הכנסות והוצאות קבועות — וקבל מיד כמה נשאר לך לשימוש.
        </p>

        <div className="monthBox">
          <label className="field">
            <span className="label">חודש</span>
            <input
              className="input"
              type="text"
              value={monthLabel}
              onChange={(e) => setMonthLabel(e.target.value)}
              placeholder="למשל: דצמבר 2025"
            />
          </label>

          <div className="heroMeter">
            <div className="pill soft">{monthLabel}</div>
            <p className="heroSmall">מלא את הנתונים וגלול לסיכום כדי להריץ בדיקת תקציב.</p>
          </div>
        </div>

        {didCalculate && (
          <a className="nextStepBox" href="/tracking" target="_blank" rel="noreferrer">
            <div>
              <div className="nextStepLabel">יומן הכנסות והוצאות שוטפות</div>
              <p className="nextStepText">
                הדף הזה אמור לשמש לתיעוד ההוצאות וההכנסות השוטפות מהחודש בצורה שמתעדכנת עם הכסף הנותר.
              </p>
            </div>

            <div className="nextStepRemaining">
              <span className="nextStepCaption">כסף נותר אחרי החישוב</span>
              <span className={remainingClass}>{formatILS(remaining)}</span>
            </div>
          </a>
        )}
      </header>

      <main className="content">
        <Section
          title="הכנסות"
          subtitle="אפשר משכורת אחת, שתיים, או כל מקור הכנסה."
          items={incomes}
          setItems={setIncomes}
          kind="income"
        />

        <Section
          title="הוצאות קבועות"
          subtitle="שכירות, מנויים, תשלומים חודשיים ועוד."
          items={expenses}
          setItems={setExpenses}
          kind="expense"
        />

        <Section
          title="אשראי חודש קודם"
          subtitle="הוצאות שכבר חויבו ויירדו בתחילת החודש הנוכחי. ניתן להוסיף כמה כרטיסים."
          items={previousCredit}
          setItems={setPreviousCredit}
          kind="expense"
          createItem={() => ({
            id: uid(),
            label: `כרטיס אשראי ${previousCredit.length + 1}`,
            amount: "",
            details: [],
            lockDetails: true,
          })}
        />

        <section className="card summaryCard">
          <div className="cardHeader">
            <div>
              <h2 className="cardTitle">סיכום</h2>
              <p className="cardSub">תמונה צבעונית ומהירה של הכנסות מול הוצאות.</p>
            </div>
            <div className="pill glass">{monthLabel}</div>
          </div>

          <div className="summary">
            <div className="summaryItem">
              <div className="summaryLabel">סה״כ הכנסות</div>
              <div className="summaryValue">{formatILS(totalIncome)}</div>
            </div>

            <div className="summaryItem">
              <div className="summaryLabel">סה״כ הוצאות</div>
              <div className="summaryValue">{formatILS(totalExpense)}</div>
            </div>

            <div className="summaryItem summaryBig">
              <div className="summaryLabel">נשאר לחודש</div>
              <div className="summaryValue">
                <span className={remainingClass}>{formatILS(remaining)}</span>
              </div>
            </div>
          </div>

        <div className="summaryActions">
          <div className="actionCopy">
            <div className="actionTitle">בדוק את מצב התקציב</div>
            <p className="actionText">
              אחרי שהמספרים מוכנים, לחץ על הכפתור כדי לקבל חיווי ברור אם אתה בעודף או במינוס.
            </p>
          </div>

          <div className="actionButtons">
            <button className="btn btnPrimary" type="button" onClick={handleCalculate}>
              חשב תקציב
            </button>
            <button
              className="btn btnGhost"
              type="button"
              onClick={handleSaveBudget}
              disabled={saveState.status === "saving"}
            >
              {saveState.status === "saving" ? "שומר..." : "שמור נתונים"}
            </button>
          </div>
        </div>

        {!didCalculate && (
          <div className="hint">
            טיפ: הסכומים מתעדכנים בזמן אמת, אבל החיווי הבהיר מופעל אחרי שתלחץ על "חשב תקציב" כאן למטה.
            </div>
          )}

          {saveState.status !== "idle" && saveState.message && (
            <div className={`hint ${saveState.status === "error" ? "pillBad" : "pillGood"}`}>
              {saveState.message}
            </div>
          )}

          {didCalculate && (
            <div className="calcNote">
              {remaining > 0 && (
                <span>✅ נראה טוב. זה התקציב הזמין שלך להוצאות משתנות (אוכל, דלק, בילויים וכו׳).</span>
              )}
              {remaining === 0 && (
                <span>⚖️ מאוזן. אין כרגע מרווח — אולי כדאי להקטין הוצאה או להוסיף הכנסה.</span>
              )}
              {remaining < 0 && (
                <span>⚠️ אתה במינוס חודשי לפי הנתונים. כדאי לעבור על ההוצאות ולצמצם/לסדר.</span>
              )}
            </div>
          )}
        </section>

        {didCalculate ? (
          <section className="card visualCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">סטטיסטיקה חזותית</h2>
                <p className="cardSub">חלוקה צבעונית של ההוצאות כדי להבין במה הכסף שלך מושקע.</p>
              </div>
            </div>

            <div className="visualGrid">
              <div className="pieShell">
                <div className="pieChart" style={{ background: pieGradient }}>
                  {!expenseSegments.length && (
                    <div className="emptyChart">הזן נתונים כדי לראות גרף חי.</div>
                  )}
                </div>
              </div>

              <div className="legendList">
                {expenseSegments.length > 0 ? (
                  expenseSegments.map((seg) => (
                    <div key={seg.id} className="legendItem">
                      <span className="legendDot" style={{ backgroundColor: seg.color }} />
                      <div className="legendTexts">
                        <div className="legendLabel">{seg.label}</div>
                        <div className="legendSub">
                          {formatILS(seg.value)} · {seg.percent}% מסך ההוצאות
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty soft">לא נוספו עדיין הוצאות להצגה.</div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="card visualCard visualCardLocked">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">סטטיסטיקה חזותית</h2>
                <p className="cardSub">הגרף יוצג מיד אחרי חישוב התקציב.</p>
              </div>
            </div>

            <div className="lockedMessage">
              <div className="lockedTitle">לחץ על "חשב תקציב" כדי לראות את העוגה</div>
              <p className="lockedSub">
                אחרי החישוב נציג כאן גרף עוגה צבעוני שמראה איך ההוצאות מתחלקות.
              </p>
            </div>
          </section>
        )}

        <footer className="footer">
          <div className="footerLine">
            המשך פיתוח (שלב הבא): קטגוריות, גרפים, חלוקה להוצאות משתנות, ושמירה לפי חודשים.
          </div>
        </footer>
      </main>
    </div>
  );
}
