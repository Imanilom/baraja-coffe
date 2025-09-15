import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Sector } from "recharts";
import { FaCheckSquare, FaInfo } from "react-icons/fa";

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
        cx, cy, midAngle, innerRadius, outerRadius,
        startAngle, endAngle, fill, payload, percent, value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Rp. ${value.toLocaleString()}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

export default function TopProductChart({ data }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const handleEnter = (_, index) => setActiveIndex(index);

    return (
        <div className="w-full h-96 max-w-3xl mx-auto">
            <div className="flex space-x-2 items-center">
                <span className="text-[14px] font-semibold text-gray-500">PENJUALAN PRODUK DENGAN NOMINAL TERTINGGI</span>
                <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
            </div>
            {data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#005429"
                            dataKey="value"
                            onMouseEnter={handleEnter}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex justify-center items-center space-x-2 h-full">
                    <FaCheckSquare size={20} className="text-[#005429]" />
                    <span className="text-gray-500">Tidak ada data</span>
                </div>
            )}
        </div>
    );
}
