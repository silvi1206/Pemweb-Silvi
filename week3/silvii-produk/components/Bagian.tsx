import { ReactNode } from "react";

type BagianProps = {
  judul?: string;
  children: ReactNode;
  className?: string;
};

export default function Bagian({ judul, children, className = "" }: BagianProps) {
  return (
    <section className={`py-8 ${className}`}>
      {judul && (
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          {judul}
        </h2>
      )}
      <div className="text-gray-600">
        {children}
      </div>
    </section>
  );
}
