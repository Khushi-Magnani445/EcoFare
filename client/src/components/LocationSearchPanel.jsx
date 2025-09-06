import { FaMapMarkerAlt } from "react-icons/fa";

export default function LocationSearchPanel({ suggestions, onSelect }) {
  if (!suggestions.length) return null;
  return (
    <div className="bg-white rounded shadow-lg border mt-2">
      {suggestions.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-green-100 border-b last:border-b-0"
          onClick={() => onSelect(s)}
        >
          <FaMapMarkerAlt className="text-green-600" />
          <span className="text-gray-800">{s}</span>
        </div>
      ))}
    </div>
  );
} 