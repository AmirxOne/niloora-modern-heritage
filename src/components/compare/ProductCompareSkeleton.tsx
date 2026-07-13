import { fa } from "@/lib/i18n/fa";
import { MAX_COMPARE_PRODUCTS } from "@/lib/product-lists/constants";

type ProductCompareSkeletonProps = {
  /** Expected column count (clamped). Defaults to a comfortable mid layout. */
  columns?: number;
};

export function ProductCompareSkeleton({ columns = 2 }: ProductCompareSkeletonProps) {
  const colCount = Math.min(Math.max(columns, 1), MAX_COMPARE_PRODUCTS);
  const rowPlaceholders = 6;

  return (
    <div
      className="compare-enhanced compare-page__skeleton"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={fa.compare.loading}
    >
      <section className="compare-enhanced__recommendation">
        <div className="sk h-5 w-48 max-w-full" />
        <div className="sk mt-3 h-3 w-72 max-w-full" />
        <div className="sk mt-5 h-10 w-full max-w-sm rounded-heritage" />
        <div className="sk mt-4 h-16 w-full rounded-heritage" />
      </section>

      <section className="compare-enhanced__summary">
        <div className="sk h-5 w-40 max-w-full" />
        <div className="compare-enhanced__summary-grid mt-4">
          {Array.from({ length: colCount }).map((_, idx) => (
            <div key={idx} className="compare-enhanced__summary-card space-y-3">
              <div className="sk h-4 w-36 max-w-full" />
              <div className="sk h-3 w-16" />
              <div className="sk h-3 w-full" />
              <div className="sk h-3 w-4/5 max-w-full" />
              <div className="sk h-3 w-16" />
              <div className="sk h-3 w-full" />
              <div className="sk h-3 w-3/5 max-w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="compare-enhanced__diff">
        <div className="sk h-5 w-44 max-w-full" />
        <div className="sk mt-3 h-3 w-64 max-w-full" />
        <div className="product-compare-table-wrap mt-4">
          <table className="product-compare-table">
            <thead>
              <tr>
                <th scope="col">
                  <div className="sk h-4 w-16" />
                </th>
                {Array.from({ length: colCount }).map((_, idx) => (
                  <th key={idx} scope="col">
                    <div className="product-compare-table__product-head">
                      <div className="sk product-compare-table__thumb" />
                      <div className="product-compare-table__meta">
                        <div className="sk h-4 w-28 max-w-full" />
                        <div className="sk h-3 w-20" />
                        <div className="product-compare-table__actions">
                          <div className="sk h-8 w-24 rounded-heritage" />
                          <div className="sk h-8 w-20 rounded-heritage" />
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowPlaceholders }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  <th scope="row">
                    <div className="sk h-3 w-20" />
                  </th>
                  {Array.from({ length: colCount }).map((_, colIdx) => (
                    <td key={colIdx}>
                      <div className="sk h-3 w-24 max-w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <span className="sr-only">{fa.compare.loading}</span>
    </div>
  );
}
