import React from 'react';
import { BloodMarkersSection } from './BloodMarkersSection';
import type { ChartData, UserData } from '@/types/dashboard';

interface BloodTabProps {
  data: ChartData;
  userData?: UserData | null;
  onMarkerClick: (label: string, data: any[]) => void;
}

export function BloodTab({ data, userData, onMarkerClick }: BloodTabProps) {
  // Blood marker sections configuration - matching original order and names exactly
  const bloodMarkerSections = [
    {
      title: "Lipid Panel",
      markers: [
        { label: "Total Cholesterol", data: data.bloodMarkers.totalCholesterol },
        { label: "LDL Cholesterol", data: data.bloodMarkers.ldl },
        { label: "HDL Cholesterol", data: data.bloodMarkers.hdl },
        { label: "Triglycerides", data: data.bloodMarkers.triglycerides },
        { label: "ApoB", data: data.bloodMarkers.apoB },
        { label: "Lp(a)", data: data.bloodMarkers.lpA },
      ]
    },
    {
      title: "Complete Blood Count",
      markers: [
        { label: "White Blood Cells", data: data.bloodMarkers.whiteBloodCells },
        { label: "Red Blood Cells", data: data.bloodMarkers.redBloodCells },
        { label: "Hematocrit", data: data.bloodMarkers.hematocrit },
        { label: "Hemoglobin", data: data.bloodMarkers.hemoglobin },
        { label: "Platelets", data: data.bloodMarkers.platelets },
      ]
    },
    {
      title: "Glucose Markers",
      markers: [
        { label: "HbA1c", data: data.bloodMarkers.hba1c },
        { label: "Fasting Insulin", data: data.bloodMarkers.fastingInsulin },
        { label: "Glucose", data: data.bloodMarkers.glucose },
      ]
    },
    {
      title: "Liver Markers",
      markers: [
        { label: "ALT", data: data.bloodMarkers.alt },
        { label: "AST", data: data.bloodMarkers.ast },
        { label: "GGT", data: data.bloodMarkers.ggt },
      ]
    },
    {
      title: "Kidney Markers",
      markers: [
        { label: "eGFR", data: data.bloodMarkers.egfr },
        { label: "Cystatin C", data: data.bloodMarkers.cystatinC },
        { label: "BUN", data: data.bloodMarkers.bun },
        { label: "Creatinine", data: data.bloodMarkers.creatinine },
        { label: "Albumin", data: data.bloodMarkers.albumin },
      ]
    },
    {
      title: "Sex Hormones",
      markers: [
        { label: "Testosterone", data: data.bloodMarkers.testosterone },
        { label: "Free Testosterone", data: data.bloodMarkers.freeTesto },
        { label: "Estradiol", data: data.bloodMarkers.estradiol },
        { label: "SHBG", data: data.bloodMarkers.shbg },
      ]
    },
    {
      title: "Thyroid Markers",
      markers: [
        { label: "T3", data: data.bloodMarkers.t3 },
        { label: "T4", data: data.bloodMarkers.t4 },
        { label: "TSH", data: data.bloodMarkers.tsh },
      ]
    },
    {
      title: "Vitamins & Inflammation",
      markers: [
        { label: "Vitamin D3", data: data.bloodMarkers.vitaminD },
        { label: "hs-CRP", data: data.bloodMarkers.crp },
        { label: "Homocysteine", data: data.bloodMarkers.homocysteine },
        { label: "IGF-1", data: data.bloodMarkers.igf1 },
      ]
    },
    {
      title: "Iron Panel",
      markers: [
        { label: "Ferritin", data: data.bloodMarkers.ferritin },
        { label: "Serum Iron", data: data.bloodMarkers.serumIron },
        { label: "TIBC", data: data.bloodMarkers.tibc },
        { label: "Transferrin Saturation", data: data.bloodMarkers.transferrinSaturation },
      ]
    },
    {
      title: "Electrolytes",
      markers: [
        { label: "Sodium", data: data.bloodMarkers.sodium },
        { label: "Potassium", data: data.bloodMarkers.potassium },
        { label: "Calcium", data: data.bloodMarkers.calcium },
        { label: "Phosphorus", data: data.bloodMarkers.phosphorus },
        { label: "Bicarbonate", data: data.bloodMarkers.bicarbonate },
        { label: "Chloride", data: data.bloodMarkers.chloride },
      ]
    },
    {
      title: "White Blood Cell Differentials",
      markers: [
        { label: "Neutrophil Count", data: data.bloodMarkers.neutrophilCount },
        { label: "Neutrophil Percentage", data: data.bloodMarkers.neutrophilPercentage },
        { label: "Lymphocyte Count", data: data.bloodMarkers.lymphocyteCount },
        { label: "Lymphocyte Percentage", data: data.bloodMarkers.lymphocytePercentage },
        { label: "Monocyte Count", data: data.bloodMarkers.monocyteCount },
        { label: "Monocyte Percentage", data: data.bloodMarkers.monocytePercentage },
        { label: "Eosinophil Count", data: data.bloodMarkers.eosinophilCount },
        { label: "Eosinophil Percentage", data: data.bloodMarkers.eosinophilPercentage },
        { label: "Basophil Count", data: data.bloodMarkers.basophilCount },
        { label: "Basophil Percentage", data: data.bloodMarkers.basophilPercentage },
      ]
    },
    {
      title: "Red Blood Cell Indices",
      markers: [
        { label: "MCV", data: data.bloodMarkers.mcv },
        { label: "MCH", data: data.bloodMarkers.mch },
        { label: "MCHC", data: data.bloodMarkers.mchc },
        { label: "RDW", data: data.bloodMarkers.rdw },
        { label: "MPV", data: data.bloodMarkers.mpv },
      ]
    },
    {
      title: "Vitamins & Minerals",
      markers: [
        { label: "Vitamin D", data: data.bloodMarkers.vitaminD },
        { label: "Vitamin B12", data: data.bloodMarkers.vitaminB12 },
        { label: "Folate", data: data.bloodMarkers.folate },
        { label: "Iron", data: data.bloodMarkers.iron },
        { label: "Magnesium", data: data.bloodMarkers.magnesium },
        { label: "RBC Magnesium", data: data.bloodMarkers.rbcMagnesium },
      ]
    },
    {
      title: "Additional Markers",
      markers: [
        { label: "Creatine Kinase", data: data.bloodMarkers.creatineKinase },
        { label: "Cortisol", data: data.bloodMarkers.cortisol },
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {bloodMarkerSections.map((section) => (
          <BloodMarkersSection
            key={section.title}
            title={section.title}
            markers={section.markers}
            userData={userData}
            onMarkerClick={onMarkerClick}
          />
        ))}
      </div>
    </div>
  );
}
