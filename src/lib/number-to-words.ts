/**
 * Utility to convert numbers to words in English and Bengali.
 * Supports the Indian numbering system (Lakh/Crore) common in Bangladesh.
 */

const bnNumbers = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
const bnTens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

const enNumbers = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const enTens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertToWordsEn(n: number): string {
  if (n < 20) return enNumbers[n];
  if (n < 100) return enTens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + enNumbers[n % 10] : '');
  if (n < 1000) return enNumbers[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertToWordsEn(n % 100) : '');
  if (n < 100000) return convertToWordsEn(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWordsEn(n % 1000) : '');
  if (n < 10000000) return convertToWordsEn(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWordsEn(n % 100000) : '');
  return convertToWordsEn(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWordsEn(n % 10000000) : '');
}

function convertToWordsBn(n: number): string {
  if (n < 20) return bnNumbers[n];
  if (n < 100) {
    // Basic mapping for Bengali tens (Simplified for common usage)
    const map: Record<number, string> = {
      20: 'বিশ', 21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আটাশ', 29: 'উনত্রিশ',
      30: 'ত্রিশ', 31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ',
      40: 'চল্লিশ', 41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ',
      50: 'পঞ্চাশ', 51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট',
      60: 'ষাট', 61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর',
      70: 'সত্তর', 71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'ঊনআশি',
      80: 'আশি', 81: 'একাশি', 82: 'বিয়াশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টাশি', 89: 'উননব্বই',
      90: 'নব্বই', 91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছেয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
    };
    return map[n] || (bnTens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + bnNumbers[n % 10] : ''));
  }
  if (n < 1000) return convertToWordsBn(Math.floor(n / 100)) + ' শত' + (n % 100 !== 0 ? ' ' + convertToWordsBn(n % 100) : '');
  if (n < 100000) return convertToWordsBn(Math.floor(n / 1000)) + ' হাজার' + (n % 1000 !== 0 ? ' ' + convertToWordsBn(n % 1000) : '');
  if (n < 10000000) return convertToWordsBn(Math.floor(n / 100000)) + ' লক্ষ' + (n % 100000 !== 0 ? ' ' + convertToWordsBn(n % 100000) : '');
  return convertToWordsBn(Math.floor(n / 10000000)) + ' কোটি' + (n % 10000000 !== 0 ? ' ' + convertToWordsBn(n % 10000000) : '');
}

export function numberToWords(amount: number, lang: 'EN' | 'BN' = 'BN'): string {
  const integerPart = Math.floor(Math.abs(amount));
  if (lang === 'BN') {
    return convertToWordsBn(integerPart) + ' টাকা মাত্র';
  } else {
    return convertToWordsEn(integerPart) + ' BDT Only';
  }
}
