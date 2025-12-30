import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "budget-landing-v1";

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

function Section({ title, subtitle, items, setItems, kind }) {
  const isIncome = kind === "income";

  function toggleDetails(id) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, showDetails: !x.showDetails } : x
      )
    );
  }

  function addRow() {
    const defaultLabel = isIncome ? "משכורת" : "הוצאה חדשה";
    setItems((prev) => [
      ...prev,
      { id: uid(), label: defaultLabel, amount: "", details: [] },
    ]);
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
  const [monthLabel, setMonthLabel] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
  });

  const [incomes, setIncomes] = useState(() => [
    { id: uid(), label: "משכורת 1", amount: "", details: [] },
    { id: uid(), label: "משכורת 2", amount: "", details: [] },
  ]);

  const [expenses, setExpenses] = useState(() => [
    { id: uid(), label: "שכירות", amount: "", details: [], lockDetails: true },
    { id: uid(), label: "חשבונות (מים, חשמל וכו)", amount: "", details: [] },
    { id: uid(), label: "מנויים", amount: "", details: [] },
    { id: uid(), label: "מעשרות", amount: "", details: [] },
  ]);

  const [didCalculate, setDidCalculate] = useState(false);

  // טעינה מ-LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.monthLabel) setMonthLabel(parsed.monthLabel);
      if (Array.isArray(parsed?.incomes)) setIncomes(parsed.incomes);
      if (Array.isArray(parsed?.expenses)) setExpenses(parsed.expenses);
    } catch {
      // מתעלמים — אם יש JSON לא תקין
    }
  }, []);

  // שמירה אוטומטית
  useEffect(() => {
    const payload = { monthLabel, incomes, expenses };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [monthLabel, incomes, expenses]);

  const totalIncome = useMemo(() => calcSum(incomes), [incomes]);
  const totalExpense = useMemo(() => calcSum(expenses), [expenses]);
  const remaining = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const expenseSegments = useMemo(() => {
    const total = calcSum(expenses);
    if (!total) return [];

    const palette = ["#6c5ce7", "#ff8b5f", "#20bfa9", "#ffa940", "#4e54c8", "#8e44ad"];
    let startAt = 0;

    return expenses
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
  }, [expenses]);

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
  }

  function resetAll() {
    setDidCalculate(false);
    setMonthLabel(() => {
      const d = new Date();
      return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
    });
    setIncomes([
      { id: uid(), label: "משכורת 1", amount: "", details: [] },
      { id: uid(), label: "משכורת 2", amount: "", details: [] },
    ]);
    setExpenses([
      { id: uid(), label: "שכירות", amount: "", details: [], lockDetails: true },
      { id: uid(), label: "מנויים", amount: "", details: [] },
      { id: uid(), label: "חשמל / מים", amount: "", details: [] },
    ]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const remainingClass =
    remaining > 0 ? "pill pillGood" : remaining < 0 ? "pill pillBad" : "pill";

  return (
    <div className="app">
      <header className="hero">
        <div className="heroTop">
          <div className="badge">מחשבון תקציב ביתי</div>
          <button className="btn btnGhost" type="button" onClick={resetAll}>
            איפוס
          </button>
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

            <button className="btn btnPrimary" type="button" onClick={handleCalculate}>
              חשב תקציב
            </button>
          </div>

          {!didCalculate && (
            <div className="hint">
              טיפ: הסכומים מתעדכנים בזמן אמת, אבל החיווי הבהיר מופעל אחרי שתלחץ על "חשב תקציב" כאן למטה.
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

        <footer className="footer">
          <div className="footerLine">
            המשך פיתוח (שלב הבא): קטגוריות, גרפים, חלוקה להוצאות משתנות, ושמירה לפי חודשים.
          </div>
        </footer>
      </main>
    </div>
  );
}
