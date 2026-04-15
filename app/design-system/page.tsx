import { Button } from "@/components/atoms/Button";

export default function DesignSystemPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 bg-gray-50 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="font-condensed font-black text-6xl text-starfeet-blue mb-4 uppercase tracking-tighter">
                    SISTEMA DE <span className="text-starfeet-lime">DISEÑO</span>
                </h1>
                <p className="font-sans text-gray-500 mb-16 max-w-lg">
                    Guía de componentes básicos y tokens para Starfeet. Todos los botones son redondeados y siguen la paleta institucional.
                </p>

                {/* VARIANTS */}
                <section className="mb-20">
                    <h2 className="font-condensed font-bold text-2xl text-starfeet-blue mb-8 uppercase tracking-widest border-b pb-2">
                        BOTONES / VARIANTES
                    </h2>
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex flex-col gap-2 items-center">
                            <Button variant="primary">Primary Button</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Primary</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <Button variant="secondary">Secondary Button</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Secondary</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <Button variant="outline">Outline Button</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Outline</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <Button variant="ghost">Ghost Button</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Ghost</span>
                        </div>
                    </div>
                </section>

                {/* SIZES */}
                <section className="mb-20">
                    <h2 className="font-condensed font-bold text-2xl text-starfeet-blue mb-8 uppercase tracking-widest border-b pb-2">
                        BOTONES / TAMAÑOS
                    </h2>
                    <div className="flex flex-wrap gap-8 items-end">
                        <div className="flex flex-col gap-2 items-center">
                            <Button size="sm">Small</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Small (sm)</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <Button size="md">Medium</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Medium (md)</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <Button size="lg">Large</Button>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Large (lg)</span>
                        </div>
                    </div>
                </section>

                {/* COLOR PALETTE */}
                <section>
                    <h2 className="font-condensed font-bold text-2xl text-starfeet-blue mb-8 uppercase tracking-widest border-b pb-2">
                        TOKENS / COLORES
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-8 bg-starfeet-blue rounded-2xl flex flex-col justify-end min-h-[150px] shadow-sm">
                            <span className="text-white font-bold text-sm">Institutional Blue</span>
                            <span className="text-white/50 text-xs text-mono">#001A49</span>
                        </div>
                        <div className="p-8 bg-starfeet-lime rounded-2xl flex flex-col justify-end min-h-[150px] shadow-sm">
                            <span className="text-starfeet-blue font-bold text-sm">Starfeet Lime</span>
                            <span className="text-starfeet-blue/50 text-xs text-mono">#D4FD23</span>
                        </div>
                        <div className="p-8 bg-starfeet-dark-900 rounded-2xl flex flex-col justify-end min-h-[150px] shadow-sm border border-gray-100">
                            <span className="text-white font-bold text-sm">Dark 900</span>
                            <span className="text-white/50 text-xs text-mono">#292928</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
