import Sidebar from '../components/Sidebar';

export default function BookOverview() {
  return (
    <main className='min-h-screen bg-slate-50 p-4 md:p-6'>
      <div className='mx-auto flex max-w-7xl flex-col gap-4 md:flex-row'>
        <Sidebar />
        <section className='flex-1 rounded-xl border border-slate-200 bg-white p-4'>
          <h1 className='text-xl font-semibold text-slate-900'>Book Overview</h1>
          <p className='mt-1 text-sm text-slate-600'>Author, date, structure, themes, and key passages by book.</p>
        </section>
      </div>
    </main>
  );
}
