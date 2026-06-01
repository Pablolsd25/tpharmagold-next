-- Add sort_order column to products table for manual ordering control
alter table products add column if not exists sort_order integer default 0;
