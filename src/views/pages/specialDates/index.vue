

<script setup>
import axios from "@/service/axiosIns.js";
import { computed, ref, onMounted, watch } from "vue";

// State
const currentDate = ref(new Date());
const selectedMonth = ref(new Date());
const staffs = ref([]);
const staffBirthdays = ref([]);
const holidays = ref([
  { name: "Янги йил", date: "2025-01-01", description: "Янги йилни нишонлаш куни" },
]);
const specialDays = ref([
  { name: "Махсус кун", date: "2025-01-15", description: "Вазифаларни ўз вақтида топширилиш куни" },
]);

// Modal state
const isModalVisible = ref(false);
const modalType = ref(null);
const modalData = ref(null);

const modalTitle = computed(() => {
  if (modalType.value === "staff") return modalData.value.name;
  if (modalType.value === "holiday") return modalData.value.name;
  if (modalType.value === "specialDay") return modalData.value.name;
  return "";
});

// Computed properties
const formattedMonth = computed(() => {
  const options = { month: "long", year: "numeric" };
  return selectedMonth.value.toLocaleDateString(undefined, options);
});

const daysOfWeek = ["Якшанба", "Душанба", "Сешанба", "Чоршанба", "Пайшанба", "Жума", "Шанба"];

const calendarDays = computed(() => {
  const firstDayOfMonth = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth(), 1);
  const lastDayOfMonth = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month filler
  const prevMonthDays = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth(), 0).getDate();
  const leadingDays = Array.from({ length: startDay }).map((_, i) => ({
    date: prevMonthDays - startDay + i + 1,
    isOtherMonth: true,
    isToday: false,
    staffBirthdays: [],
    holiday: null,
    specialDay: null,
  }));

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }).map((_, i) => {
    const date = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth(), i + 1);
    const staffBirthdaysToday = staffBirthdays.value.filter((staff) => {
      const staffBirthday = new Date(staff.birth_date);
      return staffBirthday.getDate() === date.getDate() && staffBirthday.getMonth() === date.getMonth();
    });

    const holidayToday = holidays.value.find((holiday) => new Date(holiday.date).toDateString() === date.toDateString());
    const specialDayToday = specialDays.value.find((specialDay) => new Date(specialDay.date).toDateString() === date.toDateString());

    return {
      date: i + 1,
      isOtherMonth: false,
      isToday: date.toDateString() === currentDate.value.toDateString(),
      staffBirthdays: staffBirthdaysToday,
      holiday: holidayToday,
      specialDay: specialDayToday,
    };
  });

  // Next month filler
  const trailingDays = Array.from({
    length: (7 - ((leadingDays.length + currentMonthDays.length) % 7)) % 7,
  }).map((_, i) => ({
    date: i + 1,
    isOtherMonth: true,
    isToday: false,
    staffBirthdays: [],
    holiday: null,
    specialDay: null,
  }));

  return [...leadingDays, ...currentMonthDays, ...trailingDays];
});

// Methods
const goToToday = () => {
  selectedMonth.value = new Date();
};

const changeMonth = (amount) => {
  selectedMonth.value = new Date(
    selectedMonth.value.getFullYear(),
    selectedMonth.value.getMonth() + amount,
    1
  );
};

const showDetails = (type, data) => {
  modalType.value = type;
  modalData.value = data;
  isModalVisible.value = true;
};

const getStaffs = async () => {
  const month = selectedMonth.value.getMonth() + 1; // Months are 0-based
  const year = selectedMonth.value.getFullYear();

  const url = `/staffs/get-special-dates?month_id=${month}&year=${year}`;
  const response = await axios.get(url);
  staffs.value = response.data;
  staffBirthdays.value = response.data.filter((item) => item.birth_date);
};

// Fetch data on month change
watch(selectedMonth, () => {
  getStaffs();
}, { immediate: true });

function getImage(img) {
  return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}
</script>

<template>
  <section class="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all">
    <div class="w-full max-w-8xl mx-auto px-4 lg:px-8 xl:px-14 card">
      <!-- Header Section -->
      <div class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <button @click="goToToday"
              class="hidden md:flex py-2 pl-1.5 pr-3 rounded-md border border-gray-300 dark:border-gray-700 items-center gap-1.5 text-xs font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-green-50 dark:bg-green-800' : selectedMonth.toDateString() == currentDate.toDateString()
              }"
              >
              Бугун 
            </button>
            <button @click="changeMonth(-1)"
              class="px-4 py-2 text-gray-500 dark:text-gray-400 rounded transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200">
              <i class="pi pi-chevron-left"></i>
            </button>
            <h5 class="text-xl text-center leading-8 font-semibold w-44">{{ formattedMonth }}</h5>
            <button @click="changeMonth(1)"
              class="px-4 py-2 text-gray-500 dark:text-gray-400 rounded transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200">
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="border border-gray-200 dark:border-gray-700 mb-4">
        <!-- Days of Week -->
        <div
          class="grid grid-cols-7 divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
          <div v-for="day in daysOfWeek" :key="day" class="p-3.5 text-center font-medium">
            {{ day }}
          </div>
        </div>

        <!-- Days -->
        <div class="grid grid-cols-7 divide-gray-200 dark:divide-gray-700">
          <div v-for="(day, index) in calendarDays" :key="index"
            class="calendar p-3.5 h-28 border-b border-r border-gray-200 dark:border-gray-700 relative flex flex-col items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="{ 'bg-gray-50 dark:bg-gray-800': day.isToday }">
            <!-- Staff Avatars -->
            <div class="flex items-center space-x-4 staff-avatar">
              <img v-for="staff in day.staffBirthdays" :key="staff.id" :src="getImage(staff.photo)"
                class="w-8 h-8 absolute bottom-2 left-2 rounded-full cursor-pointer object-cover" :alt="staff.fullname"
                @click="showDetails('staff', staff)" />
            </div>
            <!-- Holiday Icon -->
            <span class="absolute top-2 left-2 text-green-500 dark:text-green-400 cursor-pointer flex gap-2"
              v-if="day.holiday" @click="showDetails('holiday', day.holiday)">
              <div>
                🎉
              </div>
              <p>
                {{ day.holiday.name }}
              </p>
            </span>
            <!-- Special Day Icon -->
            <span class="absolute top-2 right-2 text-yellow-500 dark:text-yellow-400 cursor-pointer flex gap-2"
              v-if="day.specialDay" @click="showDetails('specialDay', day.specialDay)">
              <p>
                {{ day.specialDay.name }}
              </p>
              <div>
                ⭐
              </div>
            </span>
            <!-- Date Number -->
            <span class="text-sm font-medium" :class="{ 'text-gray-500 dark:text-gray-400': day.isOtherMonth }">
              {{ day.date }}
            </span>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <p-dialog v-model:visible="isModalVisible" :header="modalTitle" :breakpoints="{ '960px': '75vw' }"
        style="width: 50vw; margin-top: 10px">
        <template v-if="modalType === 'staff'">
          <div class="flex items-center gap-10">
            <div>
              <Image :src="getImage(modalData.photo)" class="w-28 rounded-full object-cover mx-auto"  alt="Staff Avatar" preview/>
            </div>
            <div>
              <p class="flex"><strong class="w-40 block">Йўналиш:</strong> {{ modalData.division_name }}</p>
              <p class="flex"><strong class="w-40 block">Унвон:</strong> {{ modalData.rank_name }}</p>
              <p class="flex"><strong class="w-40 block">Ф.И.Ш:</strong> {{ modalData.fullname }}</p>
              <p class="flex"><strong class="w-40 block">Тел рақам:</strong> {{ modalData.phone_number }}</p>
              <p class="flex"><strong class="w-40 block">Туғилган кун:</strong> {{ modalData.birth_date }}</p>
              <p class="flex"><strong class="w-40 block">Ҳолат:</strong> {{ modalData.status }}</p>
            </div>
          </div>
        </template>
        <template v-if="modalType === 'holiday'">
          <div>
            <p><strong>Байрам:</strong> {{ modalData.name }}</p>
            <p><strong>Тавсиф:</strong> {{ modalData.description }}</p>
          </div>
        </template>
        <template v-if="modalType === 'specialDay'">
          <div>
            <p><strong>Номи:</strong> {{ modalData.name }}</p>
            <p><strong>Тавсиф:</strong> {{ modalData.description }}</p>
            <p><strong>Сана:</strong> {{ modalData.date }}</p>
          </div>
        </template>
      </p-dialog>
    </div>
  </section>
</template>


<style>
/* Add additional styles if needed */
.calendar:hover .staff-avatar {
  @apply space-x-9;
}

.calendar >.absolute p {
  opacity: 0;
}

.calendar:hover>.absolute p {
  opacity: 1;
}
</style>






