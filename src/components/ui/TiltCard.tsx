import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export const TiltCard = ({ children, className, glowColor = "cyan" }: TiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;

        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        setHover(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={clsx(
                "relative transition-all duration-200 ease-out transform-gpu perspective-1000",
                className
            )}
        >
            <div
                style={{ transform: "translateZ(50px)" }}
                className={clsx(
                    "relative z-10 h-full",
                    hover ? "scale-[1.02]" : "scale-100",
                    "transition-transform duration-200"
                )}
            >
                {children}
            </div>

            {/* Holographic Glow Layer */}
            <motion.div
                className={clsx(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none z-0",
                    hover ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: `radial-gradient(circle at ${50 + x.get() * 100}% ${50 + y.get() * 100}%, rgba(34, 211, 238, 0.15), transparent 60%)`,
                    transform: "translateZ(0px)"
                }}
            />

            {/* Edge Highlight */}
            <div className={clsx(
                "absolute inset-0 rounded-2xl border border-white/5 transition-colors duration-300 pointer-events-none z-20",
                hover ? `border-${glowColor}-400/30` : "border-white/5"
            )}></div>
        </motion.div>
    );
};
