<section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Разделы</h2>
            <span className="text-xs uppercase tracking-[0.25em] text-white/40">Главная</span>
          </div>

          <div className="grid gap-3">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{section.title}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
                    {section.badge}
                  </span>
                </div>
                <p className="text-sm leading-6 text-white/65">{section.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-auto rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Следующий этап</p>
          <h2 className="mt-2 text-xl font-semibold">Подключить реальные данные</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            После этого экрана подключим Supabase и выведем настоящие заказы клиента.
          </p>
        </section>
      </section>
    </main>
  );
}