import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, Landmark, CreditCard, CalendarDays, Trash2, Download, Upload,
  Plus, AlertTriangle, Search, Lock, Eye, EyeOff, PiggyBank, ArrowUpRight,
  ArrowDownRight, Filter, Pencil, Save, Target, Smartphone, ChartColumn,
  CircleDollarSign, RotateCcw, SlidersHorizontal
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const STORAGE_KEY = 'finance-ledger-pwa-v1'
const LOCK_KEY = 'finance-ledger-pwa-lock-v1'
const CHART_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1']

const currency = (num) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(Number(num || 0))
const compactCurrency = (num) => new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(num || 0))
const todayStr = () => new Date().toISOString().slice(0, 10)
const monthKey = (date) => (date || todayStr()).slice(0, 7)
const uid = () => Math.random().toString(36).slice(2, 10)
const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const today = new Date(todayStr())
  const target = new Date(dateStr)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
const isOverdue = (dateStr) => {
  const diff = daysUntil(dateStr)
  return diff !== null && diff < 0
}

const defaultState = {
  expectedIncome: [],
  assets: [],
  debts: [],
  repayments: [],
  cashflows: [],
  budgets: [],
  settings: { maskAmounts: false, onlyUrgentDebts: false }
}

function usePersistentState() {
  const [data, setData] = useState(defaultState)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData({ ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings || {}) } })
      }
    } catch (e) {
      console.error(e)
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])
  return [data, setData]
}

function Card({ children, className = '' }) { return <div className={`card ${className}`}>{children}</div> }
function CardHeader({ children }) { return <div className="card-header">{children}</div> }
function CardContent({ children, className = '' }) { return <div className={`card-content ${className}`}>{children}</div> }
function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>{children}</button>
}
function TextInput(props) { return <input className="input" {...props} /> }
function TextArea(props) { return <textarea className="textarea" rows={3} {...props} /> }
function SelectBox({ value, onChange, children }) { return <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select> }
function Badge({ children, tone = 'default' }) { return <span className={`badge badge-${tone}`}>{children}</span> }
function Amount({ value, masked }) { return <>{masked ? '¥••••••' : currency(value)}</> }

function SummaryCard({ title, value, subtitle, icon: Icon, masked = false }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent>
          <div className="summary-row">
            <div>
              <div className="muted small">{title}</div>
              <div className="summary-value">{masked ? '¥••••••' : value}</div>
              {subtitle ? <div className="muted tiny mt8">{subtitle}</div> : null}
            </div>
            <div className="icon-chip"><Icon size={18} /></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

function ProgressBar({ value }) {
  return <div className="progress"><div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} /></div>
}

function RowActions({ onDelete, onEdit, editing = false, onDone }) {
  return (
    <div className="row-actions">
      <Button variant="secondary" size="sm" onClick={editing ? onDone : onEdit}>{editing ? <><Save size={14} />完成</> : <><Pencil size={14} />编辑</>}</Button>
      <Button variant="secondary" size="sm" onClick={onDelete}><Trash2 size={14} />删除</Button>
    </div>
  )
}

function MonthCalendar({ items, masked }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= totalDays; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const map = new Map()
  items.forEach((item) => {
    if (!item.date) return
    const dt = new Date(item.date)
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return
    const key = dt.getDate()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return (
    <div>
      <div className="muted small mb12">{year}年{month + 1}月</div>
      <div className="calendar-header">{['日','一','二','三','四','五','六'].map((w) => <div key={w}>{w}</div>)}</div>
      <div className="calendar-grid">
        {cells.map((day, idx) => {
          const dayItems = day ? (map.get(day) || []) : []
          return (
            <div key={idx} className="calendar-cell">
              <div className="calendar-day">{day || ''}</div>
              {dayItems.slice(0, 3).map((item) => (
                <div className="calendar-item" key={item.id}>
                  <div className="truncate">{item.label}</div>
                  <div>{masked ? '¥••••' : currency(item.amount)}</div>
                </div>
              ))}
              {dayItems.length > 3 ? <div className="muted tiny">+{dayItems.length - 3} 项</div> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="section-head">
      <div>
        <div className="section-title">{title}</div>
        <div className="muted small">{description}</div>
      </div>
      {action}
    </div>
  )
}

export default function App() {
  const [data, setData] = usePersistentState()
  const [tab, setTab] = useState('cashflows')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState({ key: '', id: '' })
  const [mobileMode, setMobileMode] = useState(false)
  const [cashflowTypeFilter, setCashflowTypeFilter] = useState('全部')
  const [cashflowCategoryFilter, setCashflowCategoryFilter] = useState('全部')
  const [monthFilter, setMonthFilter] = useState('全部')
  const [debtStatusFilter, setDebtStatusFilter] = useState('全部')

  const [incomeDraft, setIncomeDraft] = useState({ title: '', amount: '', expectedDate: todayStr(), status: '待收款', note: '' })
  const [assetDraft, setAssetDraft] = useState({ name: '', category: '现金', amount: '', note: '' })
  const [debtDraft, setDebtDraft] = useState({ name: '', principal: '', balance: '', monthlyPayment: '', dueDate: todayStr(), rate: '', note: '', status: '还款中' })
  const [repayDraft, setRepayDraft] = useState({ debtId: '', amount: '', date: todayStr(), note: '' })
  const [cashflowDraft, setCashflowDraft] = useState({ type: '收入', category: '日常', amount: '', date: todayStr(), title: '', note: '' })
  const [budgetDraft, setBudgetDraft] = useState({ month: monthKey(todayStr()), category: '日常', amount: '', note: '' })

  const [incomeOpen, setIncomeOpen] = useState(false)
  const [assetOpen, setAssetOpen] = useState(false)
  const [debtOpen, setDebtOpen] = useState(false)
  const [repayOpen, setRepayOpen] = useState(false)
  const [cashflowOpen, setCashflowOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)

  const [lockEnabled, setLockEnabled] = useState(false)
  const [pin, setPin] = useState('')
  const [unlockInput, setUnlockInput] = useState('')
  const [unlocked, setUnlocked] = useState(true)
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCK_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.enabled && parsed?.pin) {
          setLockEnabled(true)
          setUnlocked(false)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const masked = data.settings.maskAmounts && unlocked
  const isEditingRow = (key, id) => editing.key === key && editing.id === id
  const startEdit = (key, id) => setEditing({ key, id })
  const stopEdit = () => setEditing({ key: '', id: '' })
  const updateItem = (key, id, patch) => setData((prev) => ({ ...prev, [key]: prev[key].map((item) => item.id === id ? { ...item, ...patch } : item) }))

  const totals = useMemo(() => {
    const expected = data.expectedIncome.reduce((s, i) => s + Number(i.amount || 0), 0)
    const assets = data.assets.reduce((s, i) => s + Number(i.amount || 0), 0)
    const debts = data.debts.reduce((s, i) => s + Number(i.balance || 0), 0)
    const cashIn = data.cashflows.filter((i) => i.type === '收入').reduce((s, i) => s + Number(i.amount || 0), 0)
    const cashOut = data.cashflows.filter((i) => i.type === '支出').reduce((s, i) => s + Number(i.amount || 0), 0)
    return { expected, assets, debts, cashIn, cashOut, netWorth: assets - debts }
  }, [data])

  const thisMonth = monthKey(todayStr())
  const monthlyCashflows = useMemo(() => {
    const map = new Map()
    data.cashflows.forEach((item) => {
      const key = monthKey(item.date)
      if (!map.has(key)) map.set(key, { month: key, income: 0, expense: 0 })
      const entry = map.get(key)
      if (item.type === '收入') entry.income += Number(item.amount || 0)
      if (item.type === '支出') entry.expense += Number(item.amount || 0)
    })
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map((item) => ({ ...item, balance: item.income - item.expense }))
  }, [data.cashflows])

  const currentMonthCashflow = useMemo(() => {
    const list = data.cashflows.filter((item) => monthKey(item.date) === thisMonth)
    return {
      income: list.filter((i) => i.type === '收入').reduce((s, i) => s + Number(i.amount || 0), 0),
      expense: list.filter((i) => i.type === '支出').reduce((s, i) => s + Number(i.amount || 0), 0)
    }
  }, [data.cashflows, thisMonth])

  const budgetProgress = useMemo(() => data.budgets.map((budget) => {
    const spent = data.cashflows.filter((i) => i.type === '支出' && i.category === budget.category && monthKey(i.date) === budget.month).reduce((s, i) => s + Number(i.amount || 0), 0)
    return { ...budget, spent, remaining: Number(budget.amount || 0) - spent, progress: Number(budget.amount || 0) > 0 ? Math.min(100, (spent / Number(budget.amount)) * 100) : 0 }
  }), [data.budgets, data.cashflows])

  const assetChartData = useMemo(() => {
    const map = new Map()
    data.assets.forEach((item) => map.set(item.category, (map.get(item.category) || 0) + Number(item.amount || 0)))
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [data.assets])

  const monthEvents = useMemo(() => ([
    ...data.expectedIncome.map((i) => ({ id: `income-${i.id}`, date: i.expectedDate, label: `预计收款：${i.title}`, amount: i.amount })),
    ...data.debts.filter((i) => i.dueDate).map((i) => ({ id: `debt-${i.id}`, date: i.dueDate, label: `还款日：${i.name}`, amount: i.monthlyPayment }))
  ]), [data.expectedIncome, data.debts])

  const upcomingDebts = useMemo(() => {
    let list = [...data.debts].map((d) => ({ ...d, remainingDays: daysUntil(d.dueDate) })).sort((a, b) => (a.remainingDays ?? 9999) - (b.remainingDays ?? 9999))
    if (data.settings.onlyUrgentDebts) list = list.filter((i) => i.remainingDays !== null && i.remainingDays <= 7 && i.status !== '已结清')
    if (query) list = list.filter((i) => `${i.name} ${i.note} ${i.rate}`.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [data.debts, data.settings.onlyUrgentDebts, query])

  const availableMonths = useMemo(() => {
    const set = new Set()
    data.cashflows.forEach((i) => set.add(monthKey(i.date)))
    data.expectedIncome.forEach((i) => set.add(monthKey(i.expectedDate)))
    data.debts.forEach((i) => i.dueDate && set.add(monthKey(i.dueDate)))
    return ['全部', ...Array.from(set).sort().reverse()]
  }, [data.cashflows, data.expectedIncome, data.debts])

  const filteredCashflows = useMemo(() => {
    let list = [...data.cashflows].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    if (cashflowTypeFilter !== '全部') list = list.filter((i) => i.type === cashflowTypeFilter)
    if (cashflowCategoryFilter !== '全部') list = list.filter((i) => i.category === cashflowCategoryFilter)
    if (monthFilter !== '全部') list = list.filter((i) => monthKey(i.date) === monthFilter)
    if (query) list = list.filter((i) => `${i.title} ${i.category} ${i.note} ${i.type}`.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [data.cashflows, query, cashflowTypeFilter, cashflowCategoryFilter, monthFilter])

  const filteredIncome = useMemo(() => data.expectedIncome.filter((i) => `${i.title} ${i.status} ${i.note}`.toLowerCase().includes(query.toLowerCase())), [data.expectedIncome, query])
  const filteredAssets = useMemo(() => data.assets.filter((i) => `${i.name} ${i.category} ${i.note}`.toLowerCase().includes(query.toLowerCase())), [data.assets, query])

  const debtPressureReport = useMemo(() => [...data.debts].map((item) => ({ ...item })).sort((a, b) => Number(b.monthlyPayment || 0) - Number(a.monthlyPayment || 0)).slice(0, 5), [data.debts])
  const spendingCategoryReport = useMemo(() => {
    const map = new Map()
    data.cashflows.filter((i) => i.type === '支出' && (monthFilter === '全部' ? true : monthKey(i.date) === monthFilter)).forEach((item) => map.set(item.category, (map.get(item.category) || 0) + Number(item.amount || 0)))
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [data.cashflows, monthFilter])

  const filteredDebts = useMemo(() => {
    let list = upcomingDebts
    if (debtStatusFilter !== '全部') list = list.filter((i) => (i.status || '还款中') === debtStatusFilter)
    if (monthFilter !== '全部') list = list.filter((i) => monthKey(i.dueDate) === monthFilter)
    return list
  }, [upcomingDebts, debtStatusFilter, monthFilter])

  const maxBar = Math.max(...monthlyCashflows.map((i) => Math.max(i.income, i.expense, Math.abs(i.balance))), 0)

  const updateSetting = (key, value) => setData((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }))
  const removeItem = (key, id) => setData((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== id) }))
  const resetFilters = () => { setCashflowTypeFilter('全部'); setCashflowCategoryFilter('全部'); setMonthFilter('全部'); setDebtStatusFilter('全部'); setQuery('') }

  const addIncome = () => { if (!incomeDraft.title || !incomeDraft.amount) return; setData((prev) => ({ ...prev, expectedIncome: [{ id: uid(), ...incomeDraft, amount: Number(incomeDraft.amount) }, ...prev.expectedIncome] })); setIncomeDraft({ title: '', amount: '', expectedDate: todayStr(), status: '待收款', note: '' }); setIncomeOpen(false) }
  const addAsset = () => { if (!assetDraft.name || !assetDraft.amount) return; setData((prev) => ({ ...prev, assets: [{ id: uid(), ...assetDraft, amount: Number(assetDraft.amount) }, ...prev.assets] })); setAssetDraft({ name: '', category: '现金', amount: '', note: '' }); setAssetOpen(false) }
  const addDebt = () => { if (!debtDraft.name || !debtDraft.balance) return; setData((prev) => ({ ...prev, debts: [{ id: uid(), ...debtDraft, principal: Number(debtDraft.principal || 0), balance: Number(debtDraft.balance || 0), monthlyPayment: Number(debtDraft.monthlyPayment || 0) }, ...prev.debts] })); setDebtDraft({ name: '', principal: '', balance: '', monthlyPayment: '', dueDate: todayStr(), rate: '', note: '', status: '还款中' }); setDebtOpen(false) }
  const addCashflow = () => { if (!cashflowDraft.amount || !cashflowDraft.title) return; setData((prev) => ({ ...prev, cashflows: [{ id: uid(), ...cashflowDraft, amount: Number(cashflowDraft.amount) }, ...prev.cashflows] })); setCashflowDraft({ type: '收入', category: '日常', amount: '', date: todayStr(), title: '', note: '' }); setCashflowOpen(false) }
  const addBudget = () => { if (!budgetDraft.amount) return; setData((prev) => ({ ...prev, budgets: [{ id: uid(), ...budgetDraft, amount: Number(budgetDraft.amount) }, ...prev.budgets] })); setBudgetDraft({ month: monthKey(todayStr()), category: '日常', amount: '', note: '' }); setBudgetOpen(false) }
  const addRepayment = () => {
    if (!repayDraft.debtId || !repayDraft.amount) return
    const repayAmount = Number(repayDraft.amount || 0)
    setData((prev) => ({
      ...prev,
      repayments: [{ id: uid(), ...repayDraft, amount: repayAmount }, ...prev.repayments],
      debts: prev.debts.map((d) => {
        if (d.id !== repayDraft.debtId) return d
        const nextBalance = Math.max(0, Number(d.balance || 0) - repayAmount)
        return { ...d, balance: nextBalance, status: nextBalance === 0 ? '已结清' : d.status }
      }),
      cashflows: [{ id: uid(), type: '支出', category: '还款', amount: repayAmount, date: repayDraft.date, title: `还款：${prev.debts.find((d) => d.id === repayDraft.debtId)?.name || '负债'}`, note: repayDraft.note }, ...prev.cashflows]
    }))
    setRepayDraft({ debtId: '', amount: '', date: todayStr(), note: '' })
    setRepayOpen(false)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-ledger-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.target?.result || '{}'))
        setData({ ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings || {}) } })
      } catch {
        alert('导入失败：文件格式不是有效的 JSON')
      }
    }
    reader.readAsText(file)
  }

  const savePin = () => {
    if (!pin || pin.length < 4) { setPinError('密码至少 4 位'); return }
    localStorage.setItem(LOCK_KEY, JSON.stringify({ enabled: true, pin }))
    setLockEnabled(true)
    setPin('')
    setPinError('')
  }
  const disablePin = () => { localStorage.removeItem(LOCK_KEY); setLockEnabled(false); setUnlocked(true); setUnlockInput('') }
  const unlockApp = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}')
      if (parsed?.pin === unlockInput) { setUnlocked(true); setPinError('') } else { setPinError('密码错误') }
    } catch { setPinError('解锁失败') }
  }

  if (lockEnabled && !unlocked) {
    return <div className="lock-wrap"><Card className="lock-card"><CardContent><div className="lock-icon"><Lock size={24} /></div><div className="hero-title">解锁个人财务账本</div><div className="muted small mt8">此页面已开启本地密码保护。输入密码后才可查看内容。</div><div className="form-grid mt16"><label>本地密码</label><TextInput type="password" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} placeholder="输入密码" />{pinError ? <div className="danger small">{pinError}</div> : null}<Button onClick={unlockApp}>解锁</Button></div></CardContent></Card></div>
  }

  return (
    <div className="page">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hero">
          <div>
            <div className="pill"><Wallet size={14} /> 私人财务账本 PWA</div>
            <div className="hero-title">个人资产 / 负债 / 流水 / 还款管理</div>
            <div className="muted small mt8">本地存储，无需数据库。适合自己长期记录资产、负债、预算、回款和现金流。</div>
          </div>
          <div className="toolbar">
            <Button variant="secondary" onClick={() => setMobileMode((v) => !v)}><Smartphone size={14} />{mobileMode ? '桌面布局' : '手机布局'}</Button>
            <Button variant="secondary" onClick={exportData}><Download size={14} />导出数据</Button>
            <label className="btn btn-secondary"><Upload size={14} />导入数据<input type="file" accept="application/json" hidden onChange={importData} /></label>
          </div>
        </motion.div>

        <div className={`grid ${mobileMode ? 'one' : 'two-main'}`}>
          <Card><CardContent><div className="summary-grid"><SummaryCard title="预期赚钱总额" value={currency(totals.expected)} subtitle="待确认到账项目" icon={TrendingUp} masked={masked} /><SummaryCard title="自有财产总额" value={currency(totals.assets)} subtitle="现金 / 存款 / 投资 / 固定资产" icon={Landmark} masked={masked} /><SummaryCard title="负债余额总额" value={currency(totals.debts)} subtitle="当前剩余应还金额" icon={CreditCard} masked={masked} /><SummaryCard title="当前净资产" value={currency(totals.netWorth)} subtitle="资产 - 负债" icon={PiggyBank} masked={masked} /></div></CardContent></Card>
          <Card><CardContent><div className="section-title">快捷控制</div><div className="settings-list mt16"><div className="setting-row"><div className="setting-label">{data.settings.maskAmounts ? <EyeOff size={14} /> : <Eye size={14} />}隐藏金额</div><label className="switch"><input type="checkbox" checked={data.settings.maskAmounts} onChange={(e) => updateSetting('maskAmounts', e.target.checked)} /><span /></label></div><div className="setting-row"><div className="setting-label"><Filter size={14} />只看近期负债</div><label className="switch"><input type="checkbox" checked={data.settings.onlyUrgentDebts} onChange={(e) => updateSetting('onlyUrgentDebts', e.target.checked)} /><span /></label></div><div className="subcard"><div className="muted tiny">本地密码锁</div>{!lockEnabled ? <div className="form-grid mt8"><TextInput type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="设置 4 位及以上密码" />{pinError ? <div className="danger small">{pinError}</div> : null}<Button onClick={savePin}><Lock size={14} />开启密码锁</Button></div> : <div className="form-grid mt8"><div className="small">已开启本地密码保护</div><Button variant="secondary" onClick={disablePin}>关闭密码锁</Button></div>}</div></div></CardContent></Card>
        </div>

        <div className={`grid mt24 ${mobileMode ? 'one' : 'two-even'}`}>
          <Card><CardHeader><div className="section-title">月度收支概览</div></CardHeader><CardContent><div className="stats-3"><div className="subcard"><div className="muted small"><ArrowUpRight size={14} /> 本月收入</div><div className="metric">{masked ? '¥••••••' : currency(currentMonthCashflow.income)}</div></div><div className="subcard"><div className="muted small"><ArrowDownRight size={14} /> 本月支出</div><div className="metric">{masked ? '¥••••••' : currency(currentMonthCashflow.expense)}</div></div><div className="subcard"><div className="muted small"><Wallet size={14} /> 本月净流入</div><div className="metric">{masked ? '¥••••••' : currency(currentMonthCashflow.income - currentMonthCashflow.expense)}</div></div></div><div className="list mt16">{monthlyCashflows.length === 0 ? <div className="empty">暂无流水数据。新增收入或支出后，这里会出现近 6 个月趋势。</div> : monthlyCashflows.map((item) => <div className="list-row" key={item.month}><div className="month-cell">{item.month}</div><div><ProgressBar value={maxBar > 0 ? Math.max(item.income, item.expense, Math.abs(item.balance)) / maxBar * 100 : 0} /></div><div className="small muted">收入：{masked ? '¥••••' : compactCurrency(item.income)}</div><div className="small muted">支出：{masked ? '¥••••' : compactCurrency(item.expense)}</div><div className="small strong">结余：{masked ? '¥••••' : compactCurrency(item.balance)}</div></div>)}</div></CardContent></Card>
          <Card><CardHeader><div className="section-title">资产结构</div></CardHeader><CardContent>{assetChartData.length === 0 ? <div className="empty">暂无资产数据</div> : <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={assetChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>{assetChartData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={(value) => currency(value)} /></PieChart></ResponsiveContainer></div>}<div className="legend-list">{assetChartData.map((item, index) => <div key={item.name} className="legend-row"><div className="legend-left"><span className="legend-dot" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />{item.name}</div><span>{masked ? '¥••••••' : currency(item.value)}</span></div>)}</div></CardContent></Card>
        </div>

        <div className={`grid mt24 ${mobileMode ? 'one' : 'two-even'}`}>
          <Card><CardHeader><div className="section-title">本月资金日历</div></CardHeader><CardContent><MonthCalendar items={monthEvents} masked={masked} /></CardContent></Card>
          <Card><CardHeader><div className="section-title">预算管理</div></CardHeader><CardContent><div className="toolbar-end"><Button onClick={() => setBudgetOpen(true)}><Target size={14} />新增预算</Button></div><div className="list mt16">{budgetProgress.length === 0 ? <div className="empty">暂无预算记录</div> : budgetProgress.map((item) => <div key={item.id} className="budget-card"><div className="budget-head"><div><div className="strong">{item.month} · {item.category}</div>{item.note ? <div className="muted small">{item.note}</div> : null}</div><Button variant="secondary" size="sm" onClick={() => removeItem('budgets', item.id)}><Trash2 size={14} /></Button></div><div className="between small muted"><span>已支出 {masked ? '¥••••' : currency(item.spent)}</span><span>预算 {masked ? '¥••••' : currency(item.amount)}</span></div><ProgressBar value={item.progress} /><div className="small muted mt8">剩余：{masked ? '¥••••' : currency(item.remaining)}</div></div>)}</div></CardContent></Card>
        </div>

        <Card className="mt24"><CardHeader><div className="section-title">近 6 个月收支图表</div></CardHeader><CardContent>{monthlyCashflows.length === 0 ? <div className="empty">暂无可视化数据</div> : <div className="big-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyCashflows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => currency(value)} /><Bar dataKey="income" name="收入" fill="#0f172a" radius={[6, 6, 0, 0]} /><Bar dataKey="expense" name="支出" fill="#94a3b8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}</CardContent></Card>

        <Card className="mt24"><CardContent><div className="filters-wrap"><div className="search-wrap"><Search className="search-icon" size={16} /><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索项目、资产、负债、备注、流水分类" /></div><div className="muted small">当前流水总计：收入 <Amount value={totals.cashIn} masked={masked} />，支出 <Amount value={totals.cashOut} masked={masked} /></div></div><div className="filter-grid mt16"><SelectBox value={monthFilter} onChange={setMonthFilter}>{availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}</SelectBox><SelectBox value={cashflowTypeFilter} onChange={setCashflowTypeFilter}><option value="全部">全部流水</option><option value="收入">收入</option><option value="支出">支出</option></SelectBox><SelectBox value={cashflowCategoryFilter} onChange={setCashflowCategoryFilter}><option value="全部">全部分类</option><option value="日常">日常</option><option value="项目">项目</option><option value="固定支出">固定支出</option><option value="投资">投资</option><option value="还款">还款</option><option value="其他">其他</option></SelectBox><SelectBox value={debtStatusFilter} onChange={setDebtStatusFilter}><option value="全部">全部负债</option><option value="还款中">还款中</option><option value="宽限期">宽限期</option><option value="已结清">已结清</option></SelectBox><Button variant="secondary" onClick={resetFilters}><RotateCcw size={14} />重置筛选</Button></div></CardContent></Card>

        <div className={`grid mt24 ${mobileMode ? 'one' : 'report-grid'}`}>
          <Card><CardHeader><div className="section-title row-title"><ChartColumn size={18} />统计报表</div></CardHeader><CardContent><div className="subcard"><div className="row-title muted small"><CircleDollarSign size={14} />支出分类 Top</div><div className="mt12">{spendingCategoryReport.length === 0 ? <div className="muted small">暂无支出数据</div> : spendingCategoryReport.map((item) => <div className="between small mb8" key={item.name}><span>{item.name}</span><span>{masked ? '¥••••' : currency(item.value)}</span></div>)}</div></div><div className="subcard mt16"><div className="row-title muted small"><CreditCard size={14} />负债压力 Top</div><div className="mt12">{debtPressureReport.length === 0 ? <div className="muted small">暂无负债数据</div> : debtPressureReport.map((item) => <div key={item.id} className="report-item"><div className="between small"><span>{item.name}</span><span>{masked ? '¥••••' : currency(item.monthlyPayment)}</span></div><div className="muted tiny mt4">余额：{masked ? '¥••••' : currency(item.balance)}</div></div>)}</div></div></CardContent></Card>
          <Card><CardHeader><div className="section-title row-title"><SlidersHorizontal size={18} />当前视图摘要</div></CardHeader><CardContent><div className="stats-3"><div className="subcard"><div className="muted small">筛选后流水数</div><div className="metric">{filteredCashflows.length}</div></div><div className="subcard"><div className="muted small">筛选后负债数</div><div className="metric">{filteredDebts.length}</div></div><div className="subcard"><div className="muted small">预算条目数</div><div className="metric">{budgetProgress.length}</div></div></div></CardContent></Card>
        </div>

        <div className="tabs mt24">
          {[
            ['cashflows', '流水账'], ['income', '预期赚钱'], ['assets', '自有财产'], ['debts', '负债'], ['repayments', '还款记录']
          ].map(([key, label]) => <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>)}
        </div>

        {tab === 'cashflows' && <div className="tab-panel"><SectionHeader title="收入 / 支出流水账" description="记录每一笔实际发生的现金流，用于月度统计和日常对账。" action={<Button onClick={() => setCashflowOpen(true)}><Plus size={14} />新增流水</Button>} /><div className="list">{filteredCashflows.length === 0 ? <div className="empty">暂无流水记录</div> : filteredCashflows.map((item) => <Card key={item.id}><CardContent><div className="data-row"><div className="grow">{isEditingRow('cashflows', item.id) ? <div className="edit-grid"><TextInput value={item.title} onChange={(e) => updateItem('cashflows', item.id, { title: e.target.value })} /><TextInput type="number" value={item.amount} onChange={(e) => updateItem('cashflows', item.id, { amount: Number(e.target.value || 0) })} /><TextInput value={item.category} onChange={(e) => updateItem('cashflows', item.id, { category: e.target.value })} /><TextInput type="date" value={item.date} onChange={(e) => updateItem('cashflows', item.id, { date: e.target.value })} /><div className="span2"><TextArea value={item.note || ''} onChange={(e) => updateItem('cashflows', item.id, { note: e.target.value })} /></div></div> : <div><div className="row-title"><Badge tone={item.type === '收入' ? 'success' : 'default'}>{item.type}</Badge><div className="strong">{item.title}</div><Badge>{item.category}</Badge></div><div className="muted small mt8">日期：{item.date}</div>{item.note ? <div className="small mt8">{item.note}</div> : null}</div>}</div><div className="row-side"><div className="strong">{item.type === '收入' ? '+ ' : '- '}<Amount value={item.amount} masked={masked} /></div><RowActions onEdit={() => startEdit('cashflows', item.id)} editing={isEditingRow('cashflows', item.id)} onDone={stopEdit} onDelete={() => removeItem('cashflows', item.id)} /></div></div></CardContent></Card>)}</div></div>}

        {tab === 'income' && <div className="tab-panel"><SectionHeader title="预期赚钱" description="记录尚未到账但预期可收回的收入。" action={<Button onClick={() => setIncomeOpen(true)}><Plus size={14} />新增收入</Button>} /><div className="list">{filteredIncome.length === 0 ? <div className="empty">暂无预期收入</div> : filteredIncome.map((item) => <Card key={item.id}><CardContent><div className="data-row"><div className="grow">{isEditingRow('expectedIncome', item.id) ? <div className="edit-grid"><TextInput value={item.title} onChange={(e) => updateItem('expectedIncome', item.id, { title: e.target.value })} /><TextInput type="number" value={item.amount} onChange={(e) => updateItem('expectedIncome', item.id, { amount: Number(e.target.value || 0) })} /><TextInput type="date" value={item.expectedDate} onChange={(e) => updateItem('expectedIncome', item.id, { expectedDate: e.target.value })} /><TextInput value={item.status} onChange={(e) => updateItem('expectedIncome', item.id, { status: e.target.value })} /><div className="span2"><TextArea value={item.note || ''} onChange={(e) => updateItem('expectedIncome', item.id, { note: e.target.value })} /></div></div> : <div><div className="row-title"><div className="strong">{item.title}</div><Badge>{item.status}</Badge></div><div className="muted small mt8">预计到账：{item.expectedDate || '-'}</div>{item.note ? <div className="small mt8">{item.note}</div> : null}</div>}</div><div className="row-side"><div className="strong"><Amount value={item.amount} masked={masked} /></div><RowActions onEdit={() => startEdit('expectedIncome', item.id)} editing={isEditingRow('expectedIncome', item.id)} onDone={stopEdit} onDelete={() => removeItem('expectedIncome', item.id)} /></div></div></CardContent></Card>)}</div></div>}

        {tab === 'assets' && <div className="tab-panel"><SectionHeader title="自有财产" description="记录现金、存款、投资、设备、房车等个人资产。" action={<Button onClick={() => setAssetOpen(true)}><Plus size={14} />新增资产</Button>} /><div className="asset-grid">{filteredAssets.length === 0 ? <div className="empty">暂无资产</div> : filteredAssets.map((item) => <Card key={item.id}><CardContent><div className="data-row"><div className="grow">{isEditingRow('assets', item.id) ? <div className="edit-grid"><TextInput value={item.name} onChange={(e) => updateItem('assets', item.id, { name: e.target.value })} /><TextInput value={item.category} onChange={(e) => updateItem('assets', item.id, { category: e.target.value })} /><TextInput type="number" value={item.amount} onChange={(e) => updateItem('assets', item.id, { amount: Number(e.target.value || 0) })} /><div className="span2"><TextArea value={item.note || ''} onChange={(e) => updateItem('assets', item.id, { note: e.target.value })} /></div></div> : <div><div className="row-title"><div className="strong">{item.name}</div><Badge>{item.category}</Badge></div>{item.note ? <div className="small mt8">{item.note}</div> : null}</div>}</div><RowActions onEdit={() => startEdit('assets', item.id)} editing={isEditingRow('assets', item.id)} onDone={stopEdit} onDelete={() => removeItem('assets', item.id)} /></div><div className="metric mt16"><Amount value={item.amount} masked={masked} /></div></CardContent></Card>)}</div></div>}

        {tab === 'debts' && <div className="tab-panel"><SectionHeader title="负债" description="记录贷款、信用卡、借款等信息，并跟踪余额、状态与还款日。" action={<Button onClick={() => setDebtOpen(true)}><Plus size={14} />新增负债</Button>} /><div className="list">{filteredDebts.length === 0 ? <div className="empty">暂无负债记录</div> : filteredDebts.map((item) => { const paid = Math.max(0, Number(item.principal || 0) - Number(item.balance || 0)); const progress = Number(item.principal || 0) > 0 ? Math.min(100, (paid / Number(item.principal)) * 100) : 0; const remainDays = daysUntil(item.dueDate); const done = item.status === '已结清' || Number(item.balance || 0) === 0; return <Card key={item.id}><CardContent><div className="data-row"><div className="grow"><div className="row-title"><div className="strong">{item.name}</div>{done ? <Badge>已结清</Badge> : null}{!done && isOverdue(item.dueDate) ? <Badge tone="danger">已逾期</Badge> : null}{!done && remainDays !== null && remainDays <= 3 && remainDays >= 0 ? <Badge tone="danger"><AlertTriangle size={12} />临近还款</Badge> : null}</div>{isEditingRow('debts', item.id) ? <div className="edit-grid mt12"><TextInput value={item.name} onChange={(e) => updateItem('debts', item.id, { name: e.target.value })} /><TextInput type="date" value={item.dueDate} onChange={(e) => updateItem('debts', item.id, { dueDate: e.target.value })} /><TextInput type="number" value={item.principal} onChange={(e) => updateItem('debts', item.id, { principal: Number(e.target.value || 0) })} /><TextInput type="number" value={item.balance} onChange={(e) => updateItem('debts', item.id, { balance: Number(e.target.value || 0) })} /><TextInput type="number" value={item.monthlyPayment} onChange={(e) => updateItem('debts', item.id, { monthlyPayment: Number(e.target.value || 0) })} /><TextInput value={item.rate || ''} onChange={(e) => updateItem('debts', item.id, { rate: e.target.value })} /><div className="span2"><TextArea value={item.note || ''} onChange={(e) => updateItem('debts', item.id, { note: e.target.value })} /></div></div> : <div className="debt-grid mt12"><div>初始本金：<Amount value={item.principal} masked={masked} /></div><div>当前余额：<Amount value={item.balance} masked={masked} /></div><div>每期还款：<Amount value={item.monthlyPayment} masked={masked} /></div><div>还款日期：{item.dueDate || '-'}</div></div>}{item.rate ? <div className="muted small mt8">利率/费率：{item.rate}</div> : null}{item.note ? <div className="muted small mt8">备注：{item.note}</div> : null}<div className="mt12"><div className="between tiny muted"><span>已还进度</span><span>{progress.toFixed(1)}%</span></div><ProgressBar value={progress} /></div></div><RowActions onEdit={() => startEdit('debts', item.id)} editing={isEditingRow('debts', item.id)} onDone={stopEdit} onDelete={() => removeItem('debts', item.id)} /></div></CardContent></Card> })}</div></div>}

        {tab === 'repayments' && <div className="tab-panel"><SectionHeader title="还款记录" description="每记录一次还款，会自动冲减对应负债余额，并同步新增一条支出流水。" action={<Button onClick={() => setRepayOpen(true)}><Plus size={14} />新增还款</Button>} /><div className="list">{data.repayments.length === 0 ? <div className="empty">暂无还款记录。先在“负债”中建账，再在这里登记每次还款。</div> : data.repayments.map((item) => { const debt = data.debts.find((d) => d.id === item.debtId); return <Card key={item.id}><CardContent><div className="data-row"><div><div className="row-title"><CalendarDays size={14} className="muted" /><div className="strong">{debt?.name || '已删除负债'}</div></div><div className="muted small mt8">还款日期：{item.date}</div>{item.note ? <div className="small mt8">{item.note}</div> : null}</div><div className="row-side"><div className="strong"><Amount value={item.amount} masked={masked} /></div><Button variant="secondary" size="sm" onClick={() => removeItem('repayments', item.id)}><Trash2 size={14} />删除</Button></div></div></CardContent></Card> })}</div></div>}
      </div>

      <Modal open={cashflowOpen} title="新增流水" onClose={() => setCashflowOpen(false)}>
        <div className="form-grid"><label>类型</label><SelectBox value={cashflowDraft.type} onChange={(v) => setCashflowDraft({ ...cashflowDraft, type: v })}><option value="收入">收入</option><option value="支出">支出</option></SelectBox><label>标题</label><TextInput value={cashflowDraft.title} onChange={(e) => setCashflowDraft({ ...cashflowDraft, title: e.target.value })} placeholder="如：项目定金 / 房租 / 日常餐饮" /><label>分类</label><SelectBox value={cashflowDraft.category} onChange={(v) => setCashflowDraft({ ...cashflowDraft, category: v })}><option value="日常">日常</option><option value="项目">项目</option><option value="固定支出">固定支出</option><option value="投资">投资</option><option value="还款">还款</option><option value="其他">其他</option></SelectBox><label>金额</label><TextInput type="number" value={cashflowDraft.amount} onChange={(e) => setCashflowDraft({ ...cashflowDraft, amount: e.target.value })} /><label>日期</label><TextInput type="date" value={cashflowDraft.date} onChange={(e) => setCashflowDraft({ ...cashflowDraft, date: e.target.value })} /><label>备注</label><TextArea value={cashflowDraft.note} onChange={(e) => setCashflowDraft({ ...cashflowDraft, note: e.target.value })} /><Button onClick={addCashflow}>保存</Button></div>
      </Modal>

      <Modal open={incomeOpen} title="新增预期赚钱" onClose={() => setIncomeOpen(false)}>
        <div className="form-grid"><label>项目名称</label><TextInput value={incomeDraft.title} onChange={(e) => setIncomeDraft({ ...incomeDraft, title: e.target.value })} /><label>金额</label><TextInput type="number" value={incomeDraft.amount} onChange={(e) => setIncomeDraft({ ...incomeDraft, amount: e.target.value })} /><label>预计到账日期</label><TextInput type="date" value={incomeDraft.expectedDate} onChange={(e) => setIncomeDraft({ ...incomeDraft, expectedDate: e.target.value })} /><label>状态</label><SelectBox value={incomeDraft.status} onChange={(v) => setIncomeDraft({ ...incomeDraft, status: v })}><option value="待收款">待收款</option><option value="部分到账">部分到账</option><option value="已到账">已到账</option><option value="高风险">高风险</option></SelectBox><label>备注</label><TextArea value={incomeDraft.note} onChange={(e) => setIncomeDraft({ ...incomeDraft, note: e.target.value })} /><Button onClick={addIncome}>保存</Button></div>
      </Modal>

      <Modal open={assetOpen} title="新增自有财产" onClose={() => setAssetOpen(false)}>
        <div className="form-grid"><label>资产名称</label><TextInput value={assetDraft.name} onChange={(e) => setAssetDraft({ ...assetDraft, name: e.target.value })} /><label>分类</label><SelectBox value={assetDraft.category} onChange={(v) => setAssetDraft({ ...assetDraft, category: v })}><option value="现金">现金</option><option value="存款">存款</option><option value="投资">投资</option><option value="固定资产">固定资产</option><option value="应收款">应收款</option><option value="其他">其他</option></SelectBox><label>当前估值</label><TextInput type="number" value={assetDraft.amount} onChange={(e) => setAssetDraft({ ...assetDraft, amount: e.target.value })} /><label>备注</label><TextArea value={assetDraft.note} onChange={(e) => setAssetDraft({ ...assetDraft, note: e.target.value })} /><Button onClick={addAsset}>保存</Button></div>
      </Modal>

      <Modal open={debtOpen} title="新增负债" onClose={() => setDebtOpen(false)}>
        <div className="form-grid"><label>负债名称</label><TextInput value={debtDraft.name} onChange={(e) => setDebtDraft({ ...debtDraft, name: e.target.value })} /><label>初始本金</label><TextInput type="number" value={debtDraft.principal} onChange={(e) => setDebtDraft({ ...debtDraft, principal: e.target.value })} /><label>当前余额</label><TextInput type="number" value={debtDraft.balance} onChange={(e) => setDebtDraft({ ...debtDraft, balance: e.target.value })} /><label>每期还款金额</label><TextInput type="number" value={debtDraft.monthlyPayment} onChange={(e) => setDebtDraft({ ...debtDraft, monthlyPayment: e.target.value })} /><label>还款日期</label><TextInput type="date" value={debtDraft.dueDate} onChange={(e) => setDebtDraft({ ...debtDraft, dueDate: e.target.value })} /><label>状态</label><SelectBox value={debtDraft.status} onChange={(v) => setDebtDraft({ ...debtDraft, status: v })}><option value="还款中">还款中</option><option value="宽限期">宽限期</option><option value="已结清">已结清</option></SelectBox><label>利率 / 费率</label><TextInput value={debtDraft.rate} onChange={(e) => setDebtDraft({ ...debtDraft, rate: e.target.value })} /><label>备注</label><TextArea value={debtDraft.note} onChange={(e) => setDebtDraft({ ...debtDraft, note: e.target.value })} /><Button onClick={addDebt}>保存</Button></div>
      </Modal>

      <Modal open={repayOpen} title="新增还款记录" onClose={() => setRepayOpen(false)}>
        <div className="form-grid"><label>对应负债</label><SelectBox value={repayDraft.debtId} onChange={(v) => setRepayDraft({ ...repayDraft, debtId: v })}><option value="">选择负债</option>{data.debts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</SelectBox><label>还款金额</label><TextInput type="number" value={repayDraft.amount} onChange={(e) => setRepayDraft({ ...repayDraft, amount: e.target.value })} /><label>还款日期</label><TextInput type="date" value={repayDraft.date} onChange={(e) => setRepayDraft({ ...repayDraft, date: e.target.value })} /><label>备注</label><TextArea value={repayDraft.note} onChange={(e) => setRepayDraft({ ...repayDraft, note: e.target.value })} /><Button onClick={addRepayment}>保存</Button></div>
      </Modal>

      <Modal open={budgetOpen} title="新增预算" onClose={() => setBudgetOpen(false)}>
        <div className="form-grid"><label>月份</label><TextInput type="month" value={budgetDraft.month} onChange={(e) => setBudgetDraft({ ...budgetDraft, month: e.target.value })} /><label>分类</label><SelectBox value={budgetDraft.category} onChange={(v) => setBudgetDraft({ ...budgetDraft, category: v })}><option value="日常">日常</option><option value="项目">项目</option><option value="固定支出">固定支出</option><option value="投资">投资</option><option value="还款">还款</option><option value="其他">其他</option></SelectBox><label>预算金额</label><TextInput type="number" value={budgetDraft.amount} onChange={(e) => setBudgetDraft({ ...budgetDraft, amount: e.target.value })} /><label>备注</label><TextArea value={budgetDraft.note} onChange={(e) => setBudgetDraft({ ...budgetDraft, note: e.target.value })} /><Button onClick={addBudget}>保存</Button></div>
      </Modal>
    </div>
  )
}
