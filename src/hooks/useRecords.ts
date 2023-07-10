import { computed, ref } from "vue";

export default function useRecords(rawStr: string, cb: (str: string) => void) {
    const records = ref([rawStr])
    const currentIndex = ref(0)
    const currentRecord = computed(() => records.value[currentIndex.value])

    function push(str: string) {
        records.value.push(str)
        currentIndex.value = records.value.length - 1
        cb(str)
    }

    function showLast() {
        currentIndex.value -= 1
        cb(currentRecord.value)
    }

    function showNext() {
        currentIndex.value += 1
        cb(currentRecord.value)
    }

    function reset() {
        records.value = [rawStr]
        currentIndex.value = 0
        cb(rawStr)
    }

    return {
        push,
        showLast,
        showNext,
        reset
    }
}