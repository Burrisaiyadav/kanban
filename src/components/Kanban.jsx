import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Plus, 
  Trash2, 
  Flame, 
  MoreVertical, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Layers
} from "lucide-react";

const API_URL = "http://localhost:5000/api/cards";

export const CustomKanban = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-neutral-50 selection:bg-indigo-500/30">
      {/* Background blobs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>
      
      <div className="relative z-10 flex flex-col h-screen">
        <header className="px-12 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
              Project Board
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Manage your tasks with a premium touch.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </header>
        <Board />
      </div>
    </div>
  );
};

const Board = () => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await axios.get(API_URL);
      setCards(res.data);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto px-12 pb-12 items-start scrollbar-hide">
      <Column
        title="Backlog"
        column="backlog"
        accentColor="indigo"
        icon={<Circle className="w-4 h-4" />}
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="Todo"
        column="todo"
        accentColor="amber"
        icon={<Clock className="w-4 h-4" />}
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="In Progress"
        column="doing"
        accentColor="blue"
        icon={<MoreVertical className="w-4 h-4" />}
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="Completed"
        column="done"
        accentColor="emerald"
        icon={<CheckCircle2 className="w-4 h-4" />}
        cards={cards}
        setCards={setCards}
      />
      <BurnBarrel setCards={setCards} />
    </div>
  );
};

const Column = ({ title, cards, column, setCards, accentColor, icon }) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData("cardId", card._id || card.id);
  };

  const handleDragEnd = async (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);
    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];
      let cardToTransfer = copy.find((c) => (c._id || c.id) === cardId);
      if (!cardToTransfer) return;
      cardToTransfer = { ...cardToTransfer, column };

      copy = copy.filter((c) => (c._id || c.id) !== cardId);
      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => (el._id || el.id) === before);
        if (insertAtIndex === -1) return;
        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);
      try {
        await axios.patch(`${API_URL}/${cardId}`, { column });
      } catch (err) {
        console.error("Error updating card:", err);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
      i.style.height = "2px";
    });
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
    el.element.style.height = "4px";
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;
    return indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  const accentStyles = {
    indigo: "border-indigo-500/20 text-indigo-400 bg-indigo-500/10",
    amber: "border-amber-500/20 text-amber-400 bg-amber-500/10",
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/10",
    emerald: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  };

  return (
    <div className="w-80 shrink-0 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${accentStyles[accentColor]}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-neutral-200 uppercase tracking-wider text-xs">{title}</h3>
        </div>
        <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-neutral-500">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 rounded-2xl p-3 transition-all duration-300 border border-white/[0.05] ${
          active ? "bg-white/[0.04] border-white/[0.1] shadow-2xl" : "bg-white/[0.02]"
        }`}
      >
        <div className="space-y-3">
          {filteredCards.map((c) => (
            <Card key={c._id || c.id} {...c} handleDragStart={handleDragStart} accentColor={accentColor} />
          ))}
          <DropIndicator beforeId={null} column={column} />
        </div>
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

const Card = ({ title, _id, id, column, createdAt, handleDragStart, accentColor }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <DropIndicator beforeId={_id || id} column={column} />
      <motion.div
        layout
        layoutId={_id || id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, { title, _id, id, column })}
        className="group relative cursor-grab active:cursor-grabbing"
      >
        <div className="glass-morphism rounded-xl p-4 transition-all duration-200 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-neutral-200 leading-relaxed">{title}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const DropIndicator = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-indigo-500/50 rounded-full opacity-0 transition-all duration-200"
    />
  );
};

const BurnBarrel = ({ setCards }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => setActive(false);

  const handleDragEnd = async (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setCards((pv) => pv.filter((c) => (c._id || c.id) !== cardId));
    try {
      await axios.delete(`${API_URL}/${cardId}`);
    } catch (err) {
      console.error("Error deleting card:", err);
    }
    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative mt-12 grid h-32 w-32 place-content-center rounded-2xl border transition-all duration-300 ${
        active
          ? "border-red-500/50 bg-red-500/10 text-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
          : "border-white/10 bg-white/5 text-neutral-500"
      }`}
    >
      {active ? <Flame className="w-10 h-10 animate-pulse" /> : <Trash2 className="w-8 h-8 opacity-40" />}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-neutral-600">
        Delete
      </span>
    </div>
  );
};

const AddCard = ({ column, setCards }) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim().length) return;
    try {
      const res = await axios.post(API_URL, { column, title: text.trim() });
      setCards((pv) => [...pv, res.data]);
    } catch (err) {
      console.error("Error adding card:", err);
    }
    setAdding(false);
    setText("");
  };

  return (
    <div className="mt-4">
      <AnimatePresence>
        {adding ? (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <textarea
              onChange={(e) => setText(e.target.value)}
              autoFocus
              placeholder="What needs to be done?"
              className="w-full rounded-xl glass-morphism p-4 text-sm text-neutral-50 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none h-24"
            />
            <div className="flex items-center justify-end gap-2 px-1">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95"
              >
                Create Task
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.button
            layout
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs font-medium text-neutral-500 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

