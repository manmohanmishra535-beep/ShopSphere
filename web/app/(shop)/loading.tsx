export default function ShopLoading() {
  return (
    <div className="container-shop py-10">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-4 h-9 w-64" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="skeleton aspect-[4/5] w-full rounded-xl" />
            <div className="skeleton h-3 w-14" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
