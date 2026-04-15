import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) => {

    const baseStyles = "inline-flex items-center justify-center font-condensed font-black uppercase tracking-widest transition-all duration-300 rounded-full shadow-sm hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-starfeet-lime text-starfeet-blue hover:bg-starfeet-blue hover:text-starfeet-lime",
        secondary: "bg-starfeet-blue text-white hover:bg-starfeet-lime hover:text-starfeet-blue",
        outline: "bg-transparent border-2 border-starfeet-blue text-starfeet-blue hover:bg-starfeet-blue hover:text-white",
        ghost: "bg-transparent text-starfeet-blue hover:bg-starfeet-blue/5 shadow-none hover:shadow-none"
    };

    const sizes = {
        sm: "px-4 py-2 text-[10px]",
        md: "px-8 py-4 text-sm md:text-base",
        lg: "px-10 py-5 text-xl"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
