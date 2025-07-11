import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import axios from "axios";

const assetFormSchema = z.object({
  accountType: z.enum(["Savings", "Debit", "Credit"], {
    required_error: "Please select an account type",
  }),
  balance: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Please enter a valid positive number")
    .refine((val) => {
      const parts = val.split(".");
      return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
    }, "Balance can have up to 2 decimal places"),
  accountName: z
    .string()
    .min(1, "Account name is required")
    .max(20, "Account name must be 20 characters or less"),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

interface AssetModalProps {
  onClose?: () => void;
  userId?: string;
  onAssetAdded?: () => void;
  onAssetRefresh: () => void;
}

export default function AssetModal({ onClose, userId, onAssetAdded, onAssetRefresh }: AssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
  });

  const selectedAccountType = watch("accountType");

  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    await axios
      .post("http://localhost:3000/bankaccount/create", {
        accountName: data.accountName,
        accountType: data.accountType,
        userId: userId,
        balance: data.balance,
      })
      .then(() => {
        setIsSuccess(true);
        if (onAssetAdded) onAssetAdded();
        onAssetRefresh();
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.error("Server not responding", err);
      });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6 w-[500px] flex flex-col gap-4" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <h2 className="text-2xl font-bold text-[#3F3131] font-(family-name:--font-IBMPlexMono) mb-2">
          Create New Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-[17px] font-bold text-[#3F3131]">
              Account Type
            </label>
            <div className="flex gap-1">
              {["Savings", "Debit", "Credit"].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    {...register("accountType")}
                    className="sr-only"
                    disabled={isSubmitting || isSuccess}
                  />
                  <div
                    className={`
                    px-4 py-2 rounded-xl border-2 cursor-pointer transition-all
                    ${
                      selectedAccountType === type
                        ? "bg-[#FCD34D] border-[#FCD34D] text-[#3F3131]"
                        : "bg-gray-100 border-gray-300 text-gray-600 hover:border-[#FCD34D]"
                    }
                    ${
                      isSubmitting || isSuccess
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  `}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                </label>
              ))}
            </div>
            {errors.accountType && (
              <p className="text-red-600 text-sm mt-1">
                {errors.accountType.message}
              </p>
            )}
          </div>

          {/* Balance Input */}
          <div>
            <label
              htmlFor="balance"
              className="block mb-1 text-[17px] font-bold text-[#3F3131]"
            >
              Balance:
            </label>
            <div className="flex items-center">
              <span className="text-lg text-[#3F3131] mr-2">$</span>
              <input
                type="number"
                id="balance"
                step="0.01"
                min="0"
                {...register("balance")}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-100 text-[#3F3131] font-semibold text-[16px] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] disabled:opacity-50 disabled:cursor-not-allowed no-spinner"
                placeholder="0.00"
                disabled={isSubmitting || isSuccess}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  let value = input.value;
                  if (value.includes(".")) {
                    const [int, dec] = value.split(".");
                    if (dec.length > 2) {
                      value = int + "." + dec.slice(0, 2);
                      input.value = value;
                    }
                  }
                }}
              />
            </div>
            {errors.balance && (
              <p className="text-red-600 text-sm mt-1">
                {errors.balance.message}
              </p>
            )}
          </div>

          {/* Account Name Input */}
          <div>
            <label
              htmlFor="accountName"
              className="block mb-1 text-[17px] font-bold text-[#3F3131]"
            >
              Account Name:
            </label>
            <input
              type="text"
              id="accountName"
              maxLength={20}
              {...register("accountName")}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-100 text-[#3F3131] font-semibold text-[16px] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter account name"
              disabled={isSubmitting || isSuccess}
            />
            {errors.accountName && (
              <p className="text-red-600 text-sm mt-1">
                {errors.accountName.message}
              </p>
            )}
          </div>

          {isSuccess ? (
            <div className="cursor-not-allowed font-(family-name:--font-IBMPlexSans) bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Asset Added Successfully!
            </div>
          ) : (
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FCD34D] font-(family-name:--font-IBMPlexSans) text-[#3F3131] font-bold py-2 px-4 rounded-xl shadow-md hover:bg-[#F59E0B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#3F3131]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding Asset...
                  </>
                ) : (
                  "Add Asset"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-sm bg-gray-300 font-(family-name:--font-IBMPlexSans) text-[#3F3131] font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
