'use client';

import { useRef, useState } from 'react';

type Props = { onAdd: (title: string) => void };

export default function AddTodo({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 transition-colors bg-white">
        <span className="text-gray-300 text-lg leading-none">+</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="새 할 일 추가..."
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
        {value && (
          <button
            onClick={submit}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            추가
          </button>
        )}
      </div>
    </div>
  );
}
