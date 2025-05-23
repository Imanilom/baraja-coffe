import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateAddOns = () => {

    return (
        <div
            className={`fixed top-0 right-0 h-full max-w-screen-sm w-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}
        >
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-lg font-semibold">Tambah Opsi Tambahan</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-black">
                    ✕
                </button>
            </div>

            <div className="p-4 pb-32 overflow-y-auto h-[calc(100%-4rem)]"> {/* extra bottom padding for fixed button */}
                {/* <form> */}
                <div className="w-full">
                    <label htmlFor="">Nama Grup Opsi Tambahan</label>
                    <input type="text" className="border block w-full" />
                </div>
                <span>
                    <label htmlFor="">Jumlah Pilihan</label>
                </span>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="">Minimal pilihan Opsi Tambahan</label>
                    </div>
                    <div className="flex justify-end">
                        <input type="number" className="border" />
                    </div>
                    <div>
                        <label htmlFor="">Maksimal pilihan Opsi Tambahan</label>
                    </div>
                    <div className="flex justify-end">
                        <input type="number" className="border" />
                    </div>
                    <div>
                        <label htmlFor="">Nama Opsi Tambahan</label>
                        <input type="text" className="block border w-full" />
                    </div>
                    <div>
                        <label htmlFor="">Harga</label>
                        <input type="number" className="block border w-full" />
                    </div>
                    <div className="col-span-2">
                        <Link>
                            <span>+ Tambah Opsi Lain</span>
                        </Link>
                    </div>
                    <div className="col-span-2 flex justify-between">
                        <div className="flex-wrap">
                            <label htmlFor="">Bahan Baku</label>
                            <p>Apakah opsi tambahan ini memiliki bahan baku?</p>
                        </div>
                        <p>Tidak</p>
                    </div>
                </div>
                {/* </form> */}
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 right-0 w-full max-w-screen-lg bg-white border-t px-4 py-3 flex justify-end">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Simpan
                </button>
            </div>
        </div>
    )
}

export default CreateAddOns;
