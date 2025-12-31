import { useEffect, useMemo, useState } from "react";
import AwarenessFlow, { defaultAwarenessData } from "./AwarenessFlow";
import {
  fetchUserProfile,
  loginUser,
  saveAwareness as saveAwarenessRequest,
  saveBudget as saveBudgetRequest,
} from "./api";

const SESSION_KEY = "budget-user-session";

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

function buildDefaultBudget() {
  return {
    incomes: buildDefaultItems(defaultIncomeTemplates),
    expenses: buildDefaultItems(defaultExpenseTemplates),
    previousCredit: buildDefaultItems(defaultCreditTemplates),
  };
}

function Section({
  title,
  subtitle,
  items,
  setItems,
  kind,
  createItem,
  collapsed = false,
  onToggleCollapse = () => {},
}) {
  const isIncome = kind === "income";
  const total = useMemo(() => calcSum(items), [items]);

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
    <section className={`card collapsible ${collapsed ? "collapsed" : ""}`}>
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">{title}</h2>
          <p className="cardSub">{subtitle}</p>
        </div>

        <div className="cardHeaderActions">
          <div className="pill glass">סה״כ: {formatILS(total)}</div>
          <button className="btn btnGhost btnSmall" type="button" onClick={addRow}>
            + הוסף {isIncome ? "הכנסה" : "הוצאה"}
          </button>
          <button
            className="btn btnGhost btnSmall"
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
          >
            {collapsed ? "פתח" : "סגור"} קופסה
          </button>
        </div>
      </div>

      {collapsed ? (
        <button className="collapsedBar" type="button" onClick={onToggleCollapse}>
          לחץ כדי לפתוח ולערוך את הנתונים
        </button>
      ) : (
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
      )}
    </section>
  );
}

export default function App() {
  const [awarenessData, setAwarenessData] = useState(defaultAwarenessData);
  const [showBudget, setShowBudget] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginName, setLoginName] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("טוען נתוני משתמש...");
  const [isHydrated, setIsHydrated] = useState(false);

  const initialMonth = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const [incomes, setIncomes] = useState(() =>
    buildDefaultItems(defaultIncomeTemplates)
  );

  const [expenses, setExpenses] = useState(() =>
    buildDefaultItems(defaultExpenseTemplates)
  );

  const [previousCredit, setPreviousCredit] = useState(() =>
    buildDefaultItems(defaultCreditTemplates)
  );

  const [monthBudgets, setMonthBudgets] = useState({});

  const [didCalculate, setDidCalculate] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    income: false,
    expenses: false,
    credit: false,
  });
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const [hasSaved, setHasSaved] = useState(false);

  const userDisplayName = useMemo(() => {
    const parts = [awarenessData?.userName, awarenessData?.userLastName].filter(Boolean);
    if (parts.length) return parts.join(" ");
    if (currentUser?.name) return currentUser.name;
    return "משתמש";
  }, [awarenessData, currentUser]);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  function budgetsArrayToMap(budgets = []) {
    if (!Array.isArray(budgets)) return {};

    return budgets.reduce((acc, budget) => {
      if (budget?.monthLabel) {
        acc[budget.monthLabel] = budget;
      }
      return acc;
    }, {});
  }

  function hydrateFromProfile(profile) {
    if (!profile?.id) return;

    const nextAwareness = { ...defaultAwarenessData, ...profile.awarenessData };
    const budgetsMap = budgetsArrayToMap(profile.budgets);
    const monthToUse =
      profile.lastSelectedMonth ||
      nextAwareness.targetMonth ||
      Object.keys(budgetsMap)[0] ||
      initialMonth;

    setCurrentUser({ id: profile.id, name: profile.name || "משתמש" });
    setAwarenessData(nextAwareness);
    setShowBudget(Boolean(profile.awarenessCompleted));
    setMonthBudgets(budgetsMap);
    setSelectedMonth(monthToUse);
    loadBudgetIntoState(budgetsMap[monthToUse] || buildDefaultBudget());
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: profile.id, name: profile.name })
    );
  }

  useEffect(() => {
    async function loadSession() {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        setIsHydrated(true);
        setLoadingMessage("");
        return;
      }

      try {
        const session = JSON.parse(raw);
        if (!session?.userId) throw new Error("missing session");
        const profile = await fetchUserProfile(session.userId);
        hydrateFromProfile(profile);
      } catch (error) {
        setSessionError("נכשל בטעינת המשתמש. אנא התחבר מחדש.");
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsHydrated(true);
        setLoadingMessage("");
      }
    }

    loadSession();
  }, [initialMonth]);

  async function handleLoginSubmit(event) {
    event?.preventDefault();
    if (!loginName.trim()) {
      setSessionError("יש להזין שם משתמש קצר כדי להמשיך.");
      return;
    }

    setSessionError("");
    setLoadingMessage("מתחבר...");
    try {
      const profile = await loginUser(loginName.trim());
      hydrateFromProfile(profile);
      setShowBudget(Boolean(profile.awarenessCompleted));
    } catch (error) {
      setSessionError(error.message || "התחברות נכשלה");
    } finally {
      setIsHydrated(true);
      setLoadingMessage("");
    }
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setAwarenessData(defaultAwarenessData);
    setShowBudget(false);
    setMonthBudgets({});
    setSelectedMonth(initialMonth);
    const defaultBudget = buildDefaultBudget();
    setIncomes(defaultBudget.incomes);
    setExpenses(defaultBudget.expenses);
    setPreviousCredit(defaultBudget.previousCredit);
  }

  function handleAwarenessComplete(payload) {
    setAwarenessData(payload);
    if (payload?.targetMonth) {
      setSelectedMonth(payload.targetMonth);
    }
    setShowBudget(true);
    if (currentUser) {
      saveAwarenessRequest(currentUser.id, payload, true).catch(() => {
        setSessionError("שמירת שאלון המודעות נכשלה. אנא נסה שוב מאוחר יותר.");
      });
    }
  }

  function handleAwarenessReset(payload = defaultAwarenessData) {
    setAwarenessData(payload);
    setShowBudget(false);
    if (currentUser) {
      saveAwarenessRequest(currentUser.id, payload, false).catch(() => {
        setSessionError("שמירת איפוס השאלון נכשלה.");
      });
    }
  }

  const monthOptions = useMemo(() => {
    const now = new Date();
    const generated = Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() + idx, 1);
      return `${d.toLocaleString("he-IL", { month: "long" })} ${d.getFullYear()}`;
    });

    const existing = Object.keys(monthBudgets || {});
    const combined = [
      ...generated,
      ...existing,
      awarenessData?.targetMonth,
      selectedMonth,
    ].filter(Boolean);

    return Array.from(new Set(combined));
  }, [awarenessData?.targetMonth, monthBudgets, selectedMonth]);

  function loadBudgetIntoState(budget) {
    setIncomes(() =>
      normalizeItems(
        budget?.incomes,
        () => buildDefaultItems(defaultIncomeTemplates)
      )
    );
    setExpenses(() =>
      normalizeItems(
        budget?.expenses,
        () => buildDefaultItems(defaultExpenseTemplates)
      )
    );
    setPreviousCredit(() =>
      normalizeItems(
        budget?.previousCredit,
        () => buildDefaultItems(defaultCreditTemplates)
      )
    );
  }

  function handleMonthChange(value) {
    setSelectedMonth(value);
    const nextBudget = monthBudgets[value];
    loadBudgetIntoState(nextBudget || buildDefaultBudget());
  }

  useEffect(() => {
    if (!isHydrated) return;

    setMonthBudgets((prev) => ({
      ...prev,
      [selectedMonth]: { incomes, expenses, previousCredit },
    }));
  }, [incomes, expenses, previousCredit, selectedMonth, isHydrated]);

  useEffect(() => {
    if (!currentUser || !isHydrated) return;

    setSaveState({ status: "saving", message: "שומר נתונים..." });
    const timer = setTimeout(() => {
      saveBudgetRequest(currentUser.id, selectedMonth, {
        incomes,
        expenses,
        previousCredit,
      })
        .then(() => {
          setHasSaved(true);
          setSaveState({ status: "success", message: "הנתונים נשמרו אוטומטית." });
        })
        .catch(() => {
          setSaveState({ status: "error", message: "שמירה לשרת נכשלה. נסו שוב." });
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [currentUser, incomes, expenses, previousCredit, selectedMonth, isHydrated]);

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
  }

  function handleSaveBudget() {
    setSaveState({
      status: "success",
      message: "קיפלנו את הקופסאות והעברנו אותך לראש הדף כדי להתרכז בסיכום.",
    });
    setHasSaved(true);
    setCollapsedSections({ income: true, expenses: true, credit: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    setDidCalculate(false);
    setSelectedMonth(initialMonth);
    const defaultBudget = buildDefaultBudget();
    setIncomes(defaultBudget.incomes);
    setExpenses(defaultBudget.expenses);
    setPreviousCredit(defaultBudget.previousCredit);
    setMonthBudgets({});
    setCollapsedSections({ income: false, expenses: false, credit: false });
    setSaveState({ status: "idle", message: "" });
    setHasSaved(false);
    setShowBudget(false);
  }

  const remainingClass =
    remaining > 0 ? "pill pillGood" : remaining < 0 ? "pill pillBad" : "pill";

  if (!isHydrated) {
    return (
      <div className="app">
        <div className="pageHeading">
          <div className="titleBlock">
            <p className="pageKicker">ברוכים הבאים</p>
            <h1 className="pageTitle">מערכת ניהול תקציב</h1>
            <p className="cardSub">{loadingMessage || "טוען..."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app">
        <div className="pageHeading">
          <div className="titleBlock">
            <p className="pageKicker">כניסה ללא סיסמה</p>
            <h1 className="pageTitle">התחבר עם השם שלך</h1>
            <p className="pageMeta">
              הנתונים יישמרו עבורך גם אחרי רענון הדף או יציאה.
            </p>
          </div>
        </div>

        <main className="content">
          <section className="card">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">שלום! נזהה אותך לפי השם</h2>
                <p className="cardSub">
                  אין צורך בסיסמה. הזן שם מלא או כינוי שנוח לך ונשמור את הנתונים עבורך.
                </p>
              </div>
            </div>

            <form className="loginForm" onSubmit={handleLoginSubmit}>
              <label className="field">
                <span className="label">שם משתמש</span>
                <input
                  className="input"
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="לדוגמה: ישראל ישראלי"
                />
              </label>

              {sessionError && <div className="hint pillBad">{sessionError}</div>}

              <button className="btn btnPrimary" type="submit" disabled={!loginName.trim()}>
                התחבר
              </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  if (!showBudget) {
    return (
      <AwarenessFlow
        data={awarenessData}
        onComplete={handleAwarenessComplete}
        locked={awarenessData?.completed}
        onBackToBudget={() => setShowBudget(true)}
        onReset={handleAwarenessReset}
      />
    );
  }

  return (
    <div className="app">
      <div className="pageHeading">
        <div className="titleBlock">
          <p className="pageKicker">ברוכים הבאים</p>
          <h1 className="pageTitle">מערכת ניהול תקציב</h1>
          <div className="pageMeta">
            <span className="pill glass">{userDisplayName}</span>
            <span className="pill glass">{todayLabel}</span>
          </div>
        </div>

        <div className="pageActions">
          <div className="pageButtons">
            <button className="btn btnGhost btnSoft" type="button" onClick={() => setShowBudget(false)}>
              חזרה לשאלון מודעות
            </button>
            <button className="btn btnGhost btnSoft" type="button" onClick={resetAll}>
              איפוס
            </button>
            <button className="btn btnGhost btnSoft" type="button" onClick={handleLogout}>
              התנתק
            </button>
          </div>
          <label className="monthSelect">
            <span className="label">בחירת חודש</span>
            <select
              className="input"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {sessionError && <div className="hint pillBad">{sessionError}</div>}

      <header className={`hero ${hasSaved ? "heroGrid" : "heroSingle"}`}>
        {hasSaved ? (
          <>
            <div className="heroMain">
              <h2 className="heroTitle">כמה נשאר לך להמשך החודש אחרי ההוצאות הקבועות</h2>
              <p className="heroText">
                מטרת הדף היא לחשב עבורך את המסגרת הפנויה אחרי שהורדת את כל ההוצאות הקבועות,
                כדי שתיגש להוצאות המשתנות כשברור לך כמה נשאר.
              </p>
              <p className="heroSmall">
                הנתונים של {selectedMonth} נשמרים עבורך. בכל מעבר לחודש אחר תוכל לראות את הנתונים שהזנת עבורו.
              </p>
            </div>

            <div className="heroSide">
              <div className="sideBox sideHighlight accentBox">
                <div className="sideLabel">כמה נשאר אחרי ההוצאות הקבועות</div>
                <div className="sideValue">
                  <span className={remainingClass}>{formatILS(remaining)}</span>
                </div>
                <p className="sideHelper">הסכום הזמין להוצאות המשתנות בחודש הנבחר.</p>
              </div>

              <a className="ctaButton" href="/tracking" target="_blank" rel="noreferrer">
                מעבר לכסף הנזיל
              </a>
            </div>
          </>
        ) : (
          <div className="heroSingleContent">
            <div className="heroMain heroMainCentered">
              <h2 className="heroTitle">כמה נשאר לך להמשך החודש אחרי ההוצאות הקבועות</h2>
              <p className="heroText">
                מטרת הדף היא לחשב עבורך את המסגרת הפנויה אחרי שהורדת את כל ההוצאות הקבועות,
                כדי שתיגש להוצאות המשתנות כשברור לך כמה נשאר.
              </p>
              <p className="heroSmall">
                הנתונים של {selectedMonth} נשמרים עבורך. בכל מעבר לחודש אחר תוכל לראות את הנתונים שהזנת עבורו.
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="content">
        <Section
          title="הכנסות"
          subtitle="אפשר משכורת אחת, שתיים, או כל מקור הכנסה."
          items={incomes}
          setItems={setIncomes}
          kind="income"
          collapsed={collapsedSections.income}
          onToggleCollapse={() =>
            setCollapsedSections((prev) => ({
              ...prev,
              income: !prev.income,
            }))
          }
        />

        <Section
          title="הוצאות קבועות"
          subtitle="שכירות, מנויים, תשלומים חודשיים ועוד."
          items={expenses}
          setItems={setExpenses}
          kind="expense"
          collapsed={collapsedSections.expenses}
          onToggleCollapse={() =>
            setCollapsedSections((prev) => ({
              ...prev,
              expenses: !prev.expenses,
            }))
          }
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
          collapsed={collapsedSections.credit}
          onToggleCollapse={() =>
            setCollapsedSections((prev) => ({
              ...prev,
              credit: !prev.credit,
            }))
          }
        />

        <section className="card summaryCard">
          <div className="cardHeader">
            <div>
              <h2 className="cardTitle">סיכום</h2>
              <p className="cardSub">תמונה צבעונית ומהירה של הכנסות מול הוצאות.</p>
            </div>
            <div className="pill glass">{selectedMonth}</div>
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
