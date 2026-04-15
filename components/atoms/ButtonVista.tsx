export const ButtonVista = ({ children }: { children: React.ReactNode }) => {
    return (
        <button className="px-8 py-4 bg-starfeet-lime text-starfeet-blue font-condensed font-black text-xl hover:bg-white transition-colors uppercase tracking-widest rounded-full shadow-lg pointer-events-auto">
            {children}
        </button>
    );
};
