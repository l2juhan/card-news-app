import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCardNewsStore } from '../stores/useCardNewsStore';

// ---------------------------------------------------------------------------
// Sortable Thumbnail
// ---------------------------------------------------------------------------

function SortableThumb({
  id,
  index,
  imagePath,
  isSelected,
}: {
  id: string;
  index: number;
  imagePath: string | undefined;
  isSelected: boolean;
}) {
  const selectSlide = useCardNewsStore((s) => s.selectSlide);
  const slideNumber = index + 1;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => selectSlide(slideNumber)}
      className={`
        relative w-16 h-20 rounded-md overflow-hidden cursor-grab active:cursor-grabbing
        border-2 transition-colors
        ${isSelected ? 'border-primary shadow-sm' : 'border-transparent hover:border-border'}
      `}
    >
      {imagePath ? (
        <img
          src={`file://${imagePath}`}
          alt={`슬라이드 ${slideNumber}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-surface-tertiary flex items-center justify-center">
          <span className="text-[10px] text-text-tertiary">{slideNumber}</span>
        </div>
      )}
      <span className="absolute bottom-0.5 right-1 text-[9px] font-medium text-white bg-black/50 px-1 rounded">
        {slideNumber}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlideGrid
// ---------------------------------------------------------------------------

export function SlideGrid() {
  const slides = useCardNewsStore((s) => s.slides);
  const imagePaths = useCardNewsStore((s) => s.imagePaths);
  const selectedSlide = useCardNewsStore((s) => s.selectedSlide);
  const isEditing = useCardNewsStore((s) => s.isEditing);
  const isGenerating = useCardNewsStore((s) => s.isGenerating);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const ids = slides.map((s) => `slide-${s.slide}`);

  // getState()로 최신 slides를 읽어 stale closure 방지
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const state = useCardNewsStore.getState();
    if (state.isEditing || state.isGenerating) return;

    const currentSlides = state.slides;
    const currentIds = currentSlides.map((s) => `slide-${s.slide}`);
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const ordered = [...currentSlides];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);

    const newOrder = ordered.map((s) => s.slide);

    state.setEditing(true);
    window.api.reorderSlides(newOrder).catch(() => {
      useCardNewsStore.getState().setEditing(false);
    });
  }, []);

  if (slides.length === 0) return null;

  const isBusy = isEditing || isGenerating;

  return (
    <div className="w-full px-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          슬라이드 순서
        </span>
        <span className="text-[10px] text-text-tertiary">(드래그하여 변경)</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy} disabled={isBusy}>
          <div className="flex flex-wrap gap-1.5">
            {slides.map((slide, index) => (
              <SortableThumb
                key={`slide-${slide.slide}`}
                id={`slide-${slide.slide}`}
                index={index}
                imagePath={imagePaths[index]}
                isSelected={selectedSlide === index + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
