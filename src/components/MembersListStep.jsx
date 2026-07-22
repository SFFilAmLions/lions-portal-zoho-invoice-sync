export default function MembersListStep({ onComplete }) {
  return (
    <div>
      <p>Step 1: Members List (stub)</p>
      <button
        onClick={() =>
          onComplete({
            rows: [],
            fileName: 'test.csv',
            cachedAt: new Date().toISOString(),
          })
        }
      >
        Continue (stub)
      </button>
    </div>
  )
}
