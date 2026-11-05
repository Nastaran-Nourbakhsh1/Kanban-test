"use client";
import {
  useReducer,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  pointerWithin,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Plus,
  X,
  GripVertical,
  Trash2,
  ArrowLeft,
  Pencil,
  Columns3,
  ArrowLeftRight,
} from "lucide-react";
import {
  boardReducer,
  initialBoard,
  type Card,
  type Column,
  type Action,
} from "@/lib/board";

const fa = (n: number) => n.toLocaleString("fa-IR");
function Modal({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          dir="rtl"
          onCloseAutoFocus={onCloseAutoFocus}
          onOpenAutoFocus={(e) => {
            const input =
              document.querySelector<HTMLInputElement>(".modal input");
            if (input) {
              e.preventDefault();
              input.focus();
            }
          }}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <Dialog.Close className="icon-button modal-close" aria-label="بستن">
            <X size={19} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function AddCard({
  column,
  dispatch,
}: {
  column: Column;
  dispatch: React.Dispatch<Action>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("عنوان کارت را وارد کنید.");
      e.currentTarget.querySelector("input")?.focus();
      return;
    }
    dispatch({
      type: "add",
      columnId: column.id,
      card: { id: crypto.randomUUID(), title, details: details.trim() },
    });
    setOpen(false);
  }
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setTitle("");
          setDetails("");
          setError("");
        }
      }}
      title="کارت جدید"
      description={`افزودن به ستون «${column.name}»`}
      trigger={
        <button className="add-card">
          <Plus size={17} />
          افزودن کارت
        </button>
      }
    >
      <form onSubmit={submit} noValidate>
        <label htmlFor={`title-${column.id}`}>
          عنوان کارت <span className="required">*</span>
        </label>
        <input
          id={`title-${column.id}`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `error-${column.id}` : undefined}
          placeholder="چه کاری باید انجام شود؟"
        />
        {error && (
          <p role="alert" id={`error-${column.id}`} className="error">
            {error}
          </p>
        )}
        <label htmlFor={`details-${column.id}`}>
          جزئیات <span className="optional">اختیاری</span>
        </label>
        <textarea
          id={`details-${column.id}`}
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="کمی بیشتر درباره این کار بنویسید…"
        />
        <div className="modal-actions">
          <button className="primary" type="submit">
            <Plus size={17} />
            افزودن کارت
          </button>
          <Dialog.Close className="secondary" type="button">
            انصراف
          </Dialog.Close>
        </div>
      </form>
    </Modal>
  );
}
function TaskCard({
  card,
  columns,
  columnId,
  dispatch,
}: {
  card: Card;
  columns: Column[];
  columnId: string;
  dispatch: React.Dispatch<Action>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: card.id });
  const [deleting, setDeleting] = useState(false);
  const deleteTarget = useRef<HTMLButtonElement | null>(null);
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`task-card ${isDragging ? "dragging" : ""} ${isOver ? "card-drop-target" : ""}`}
      data-testid={card.id}
    >
      <div className="card-top">
        <span className="card-mark" />
        <button
          className="icon-button drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`جابه‌جایی ${card.title}`}
        >
          <GripVertical size={18} />
        </button>
      </div>
      <h3>{card.title}</h3>
      {card.details && <p className="card-details">{card.details}</p>}
      <div className="card-actions">
        <div className="move-control">
          <ArrowLeftRight size={14} aria-hidden="true" />
          <select
            aria-label={`انتقال ${card.title} به ستون`}
            value={columnId}
            onChange={(e) =>
              dispatch({
                type: "move",
                cardId: card.id,
                columnId: e.target.value,
              })
            }
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Modal
          title="حذف کارت؟"
          description={`کارت «${card.title}» از تخته حذف می‌شود.`}
          open={deleting}
          onOpenChange={setDeleting}
          onCloseAutoFocus={(e) => {
            if (deleteTarget.current) {
              e.preventDefault();
              deleteTarget.current.focus();
            }
          }}
          trigger={
            <button
              className="icon-button delete-button"
              aria-label={`حذف ${card.title}`}
            >
              <Trash2 size={15} />
            </button>
          }
        >
          <div className="modal-actions">
            <button
              className="danger"
              onClick={(e) => {
                deleteTarget.current =
                  document.querySelector<HTMLButtonElement>(
                    `[data-testid="${columnId}"] .add-card`,
                  );
                setDeleting(false);
                dispatch({ type: "delete", cardId: card.id });
              }}
            >
              حذف کارت
            </button>
            <Dialog.Close className="secondary">انصراف</Dialog.Close>
          </div>
        </Modal>
      </div>
    </article>
  );
}
function BoardColumn({
  column,
  index,
  columns,
  dispatch,
}: {
  column: Column;
  index: number;
  columns: Column[];
  dispatch: React.Dispatch<Action>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: column.cards.length > 0,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const cancelled = useRef(false);
  const nameButton = useRef<HTMLButtonElement>(null);
  function save() {
    if (!cancelled.current)
      dispatch({ type: "rename", columnId: column.id, name });
    setEditing(false);
  }
  return (
    <section
      className={`column column-${index} ${isOver ? "drop-target" : ""}`}
      aria-label={column.name}
      data-testid={column.id}
    >
      <div className="column-heading">
        <span className="status-dot" />
        {editing ? (
          <input
            className="column-name-input"
            aria-label="نام ستون"
            value={name}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
                requestAnimationFrame(() => nameButton.current?.focus());
              }
              if (e.key === "Escape") {
                cancelled.current = true;
                setEditing(false);
                requestAnimationFrame(() => nameButton.current?.focus());
              }
            }}
          />
        ) : (
          <button
            ref={nameButton}
            className="column-name"
            aria-label={`تغییر نام ${column.name}`}
            onClick={() => {
              setName(column.name);
              cancelled.current = false;
              setEditing(true);
            }}
          >
            {column.name}
            <Pencil size={12} />
          </button>
        )}
        <span className="count">{fa(column.cards.length)}</span>
      </div>
      <div className="column-body" ref={setNodeRef}>
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <TaskCard
              key={card.id}
              card={card}
              columns={columns}
              columnId={column.id}
              dispatch={dispatch}
            />
          ))}
        </SortableContext>
        {column.cards.length === 0 && (
          <div className="empty-column">کارت را اینجا رها کنید</div>
        )}
      </div>
      <AddCard column={column} dispatch={dispatch} />
    </section>
  );
}
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : closestCenter(args);
};
export default function Board() {
  const [columns, dispatch] = useReducer(boardReducer, undefined, initialBoard);
  const [active, setActive] = useState<Card | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function endDrag({ active, over }: DragEndEvent) {
    setActive(null);
    if (!over || active.id === over.id) return;
    const destination = columns.find(
      (c) => c.id === over.id || c.cards.some((card) => card.id === over.id),
    );
    if (!destination) return;
    const index = destination.cards.findIndex((card) => card.id === over.id);
    dispatch({
      type: "move",
      cardId: String(active.id),
      columnId: destination.id,
      index: index < 0 ? undefined : index,
    });
    setAnnouncement(`کارت به ستون ${destination.name} منتقل شد.`);
  }
  const total = columns.reduce((sum, c) => sum + c.cards.length, 0);
  return (
    <>
      <a className="skip-link" href="#board">
        رفتن به تخته
      </a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">
            <Columns3 size={23} />
          </span>
          <strong>
            کانبان<span className="brand-dot">.</span>
          </strong>
          <span className="brand-divider" />
          <span className="workspace-label">فضای کار شما</span>
        </div>
        <span className="header-note">
          <span />
          جایی برای پیش رفتن
        </span>
      </header>
      <main>
        <div className="board-intro">
          <div className="eyebrow">
            <span />
            از ایده تا انجام
          </div>
          <h1>
            کارهای بزرگ، قدم‌های کوچک<span>.</span>
          </h1>
          <p>ذهنت را خلوت کن. کارها را بچین و هر روز یک قدم جلوتر برو.</p>
        </div>
        <div className="board-toolbar">
          <div className="board-title">
            <Columns3 size={19} />
            <h2>تخته پروژه</h2>
            <span className="board-total">{fa(total)} کارت</span>
          </div>
          <span className="board-hint">
            <ArrowLeft size={15} />
            کارت‌ها را بگیر و جابه‌جا کن
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={collision}
          onDragStart={({ active }) =>
            setActive(
              columns.flatMap((c) => c.cards).find((c) => c.id === active.id) ??
                null,
            )
          }
          onDragEnd={endDrag}
          onDragCancel={() => setActive(null)}
          accessibility={{
            announcements: {
              onDragStart: () => "کارت برداشته شد.",
              onDragOver: ({ over }) =>
                over
                  ? `مقصد: ${columns.find((c) => c.id === over.id || c.cards.some((card) => card.id === over.id))?.name ?? ""}`
                  : "کارت را روی یک ستون رها کنید.",
              onDragEnd: () => "کارت رها شد.",
              onDragCancel: () => "جابه‌جایی لغو شد.",
            },
            screenReaderInstructions: {
              draggable:
                "برای برداشتن کارت فاصله را فشار دهید. با کلیدهای جهت جابه‌جا کنید، با فاصله رها کنید و با Escape انصراف دهید.",
            },
          }}
        >
          <div
            id="board"
            className="board-scroll"
            tabIndex={0}
            aria-label="تخته کانبان"
          >
            <div className="board-grid">
              {columns.map((column, index) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  columns={columns}
                  index={index}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {active && (
              <div className="task-card drag-preview" dir="rtl">
                <h3>{active.title}</h3>
                <p className="card-details">{active.details}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
        <div className="board-footer">
          <span>
            <span className="footer-dot" />
            یک تخته، برای تمرکز بیشتر
          </span>
          <span>تغییرات موقتی‌اند و با بارگذاری دوباره پاک می‌شوند.</span>
        </div>
        <div role="status" className="sr-only">
          {announcement}
        </div>
      </main>
    </>
  );
}
