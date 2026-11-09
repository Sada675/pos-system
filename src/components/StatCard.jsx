import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

function StatCard({ title, value, icon: Icon, change, color }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </h3>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon size={23} />
        </div>

      </div>

      <div className="mt-5 flex items-center gap-2 text-xs">

        <span className="flex items-center gap-1 font-semibold text-emerald-600">
          <TrendingUp size={14} />
          {change}
        </span>

        <span className="text-slate-400">
          vs last month
        </span>

      </div>

    </motion.div>
  );
}

export default StatCard;