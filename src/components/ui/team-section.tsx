import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

interface TeamMember {
  name: string;
  image: string;
}

export interface AnimatedTeamSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  members: TeamMember[];
}

const getCardState = (index: number, total: number) => {
  const centerIndex = (total - 1) / 2;
  const distanceFromCenter = index - centerIndex;
  const x = distanceFromCenter * 90;
  const y = Math.abs(distanceFromCenter) * -30;
  const rotate = distanceFromCenter * 12;
  return { x, y, rotate };
};

const AnimatedTeamSection = React.forwardRef<HTMLDivElement, AnimatedTeamSectionProps>(
  ({ title, description, members, className, ...props }, ref) => {
    const controls = useAnimation();
    const [inViewRef, inView] = useInView({
      triggerOnce: true,
      threshold: 0.2,
    });

    React.useEffect(() => {
      if (inView) controls.start("visible");
    }, [controls, inView]);

    const containerVariants = {
      hidden: {},
      visible: { transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
      hidden: { opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 },
      visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        x: getCardState(i, members.length).x,
        y: getCardState(i, members.length).y,
        rotate: getCardState(i, members.length).rotate,
        transition: { type: "spring" as const, stiffness: 120, damping: 12 },
      }),
    };

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        inViewRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [inViewRef, ref],
    );

    return (
      <section ref={setRefs} className={cn("w-full py-20 sm:py-28", className)} {...props}>
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="relative mx-auto mt-20 flex h-72 w-full max-w-3xl items-center justify-center sm:h-80"
          >
            {members.map((member, index) => (
              <motion.div
                key={member.name}
                custom={index}
                variants={itemVariants}
                className="absolute flex flex-col items-center"
                style={{ zIndex: members.length - Math.abs(index - (members.length - 1) / 2) }}
              >
                <div className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut sm:h-32 sm:w-32">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="mt-3 whitespace-nowrap rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut">
                  {member.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  },
);

AnimatedTeamSection.displayName = "AnimatedTeamSection";

export { AnimatedTeamSection };
